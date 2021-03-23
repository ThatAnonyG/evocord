import {
  FATAL_CODES,
  InternalEvents,
  OPCode,
  Payload,
  Ratelimit,
  Status,
} from "@/lib/utils/constants";
import { log } from "@/lib/utils/utils";
import EventEmitter from "events";
import WebSocket, { Data } from "ws";
import { Client } from "../Client";
import { EventManager } from "./events/EventManager";

class Shard extends EventEmitter {
  public ws: WebSocket | null = null;
  public gateway = "";

  private _heartbeatInterval = -1;
  private _heartbeatTimer: NodeJS.Timeout | null = null;
  private _heartbeatAck = false;

  private _lastPinged = -1;
  public ping = -1;

  public _sessionId: string | null = null;
  private _lastSeq = -1;

  public status: Status = Status.DISCONNECTED;
  public ratelimit: {
    queue: Payload[];
    remaining: number;
    timeout: NodeJS.Timeout | null;
  } = {
    queue: new Array<Payload>(),
    remaining: Ratelimit.GATEWAY.commands,
    timeout: null,
  };

  public eventManager = new EventManager(this);
  public unavailableGuilds = new Set();

  constructor(public readonly client: Client, public readonly id: number) {
    super();
  }

  public async spawn(): Promise<void> {
    this.ws = new WebSocket(this.gateway);

    this.ws.on("open", () => {
      log(`SHARD ${this.id}`, "Connected to discord gateway.");
      this.status = Status.CONNECTING;
    });

    this.ws.on("error", (err) => {
      log(`SHARD ${this.id}`, `${err.stack || err.message}`, "ERR");
      this.emit(InternalEvents.SHARD_ERROR, this, err);
    });

    this.ws.on("close", (code, reason) => {
      this.status = Status.DISCONNECTED;
      log(
        `SHARD ${this.id}`,
        `Code: ${code}\nReason: ${reason || "No reason provided"}`
      );

      if (code === 1000) {
        this.destroy();
        this.emit(InternalEvents.SHARD_CLOSE, code, reason);
      } else if (FATAL_CODES.includes(code)) {
        this.client.shards.destroy();
        this.emit(InternalEvents.SHARD_CLOSE, code, reason);
      } else if ([4006, 4007].includes(code)) {
        this._sessionId = null;
        this.reconnect();
        return;
      } else {
        this.reconnect();
        return;
      }
    });

    this.ws.on("message", this._onPacket.bind(this));
  }

  public _onPacket(payload: Data): void {
    const data: Payload = JSON.parse(payload.toString());
    if (data.s && this._lastSeq < data.s) this._lastSeq = data.s;
    log(
      `SHARD ${this.id}`,
      `(${
        (Object.entries(OPCode).find(
          ([, code]) => code === (data.op as number)
        ) || ["UNKNOWN"])[0]
      }) Received data from discord.\n${JSON.stringify(data, null, 4)}`
    );

    switch (data.op) {
      case OPCode.HEARTBEAT:
        log(`SHARD ${this.id}`, "Requested heartbeat...");
        this.send({
          op: OPCode.HEARTBEAT,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          d: this._lastSeq ? this._lastSeq : null,
        });
        log(`SHARD ${this.id}`, "Sending heartbeat on request...");
        break;
      case OPCode.HELLO:
        this._heartbeatInterval = data.d.heartbeat_interval as number;

        this._heartbeatTimer = setInterval(() => {
          this._lastPinged = Date.now();
          this._heartbeatAck = false;
          try {
            this.send({
              op: OPCode.HEARTBEAT,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              d: this._lastSeq ? this._lastSeq : null,
            });
            log(`SHARD ${this.id}`, "Sending heartbeat...");
          } catch (err) {
            log(`SHARD ${this.id}`, `${err.stack || err.message}`, "ERR");
          }
        }, this._heartbeatInterval);

        if (this._sessionId) this.resume();
        else this.identify();
        break;

      case OPCode.HEARTBEAT_ACK:
        this._heartbeatAck = true;
        this.ping = Date.now() - this._lastPinged;
        log(`SHARD ${this.id}`, "Acknowledged heartbeat.");
        break;

      case OPCode.RECONNECT:
        log(
          `SHARD ${this.id}`,
          "Reconnect request from discord. Attempting reconnect..."
        );
        this.reconnect();
        break;

      case OPCode.INVALID_SESSION:
        log(`SHARD ${this.id}`, `Invalid Session. Resumeable: ${data.d}`);
        if (!(data.d as unknown) as boolean) this._sessionId = null;
        this.reconnect();
        break;

      case OPCode.DISPATCH:
        if (!data.t || !this.eventManager.manager.has(data.t))
          return log(
            `SHARD ${this.id}`,
            `Unhandled event with name: ${data.t}`
          );
        else {
          const handler = this.eventManager.manager.get(data.t);
          if (handler) {
            handler.call(this, this.eventManager._parseData(data.d));
          }
          break;
        }
    }
  }

  public send(data: Payload, important = false): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      throw new Error("Websocket does not exit or it is not open.");
    if (!JSON.stringify(data).startsWith("{"))
      throw new TypeError("Invalid payload format");

    important
      ? this.ratelimit.queue.unshift(data)
      : this.ratelimit.queue.push(data);

    this._handleQueue();
  }

  private _handleQueue(): void {
    if (this.ratelimit.remaining === 0)
      return log(
        `SHARD ${this.id}`,
        `Ratelimit exceeded! Enqueued this command. ${this.ratelimit.queue.length} commands in queue!`
      );
    if (this.ratelimit.queue.length === 0)
      return log(`SHARD ${this.id}`, "No commands in queue.");

    if (this.ratelimit.remaining === Ratelimit.GATEWAY.commands) {
      this.ratelimit.timeout = setTimeout(() => {
        this.ratelimit.remaining = Ratelimit.GATEWAY.commands;

        log(
          `SHARD ${this.id}`,
          `
Ratelimit reset!
Queue: ${this.ratelimit.queue.length}
Remaining: ${this.ratelimit.remaining}`
        );

        if (this.ratelimit.timeout) clearTimeout(this.ratelimit.timeout);
        this.ratelimit.timeout = null;
        this._handleQueue();
      }, Ratelimit.GATEWAY.resetsAfter);
    }

    while (this.ratelimit.remaining > 0) {
      const payload = this.ratelimit.queue.shift();
      if (!payload || !this.ws) return;

      this.ws.send(JSON.stringify(payload), (err) => {
        if (err) this.emit(InternalEvents.SHARD_ERROR, this, err);
      });

      this.ratelimit.remaining--;
    }
  }

  public destroy(): void {
    this.ws?.removeAllListeners();

    if (this.ws?.readyState === WebSocket.OPEN)
      this.ws?.close(1000, "Destroyed.");
    if (!this._sessionId) this._lastSeq = -1;

    this._heartbeatAck = false;
    this._heartbeatInterval = -1;

    if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
    this._heartbeatTimer = null;

    if (this.ratelimit.timeout) clearTimeout(this.ratelimit.timeout);
    this.ratelimit = {
      queue: [],
      remaining: Ratelimit.GATEWAY.commands,
      timeout: null,
    };

    this.ws = null;
  }

  public identify(
    options: {
      compress: boolean;
      large_threshold: number;
      guild_subscriptions: boolean;
    } = {
      compress: false,
      large_threshold: 50,
      guild_subscriptions: true,
    }
  ): void {
    try {
      const data = {
        token: this.client.token,
        properties: {
          $os: process.platform,
          $browser: "packageName",
          $device: "packageName",
        },
        shards: [this.id, this.client.options.shardAmount],
        intents: this.client.options.intents.reduce((acc, val) => acc + val, 0),
        ...options,
      };

      this.send({
        op: OPCode.IDENTIFY,
        d: this.client.options.presense
          ? { presence: this.client.options.presense, ...data }
          : data,
      });
    } catch (err) {
      throw new Error(
        `[SHARD ${this.id}] Identification failed.\n${err.stack || err.message}`
      );
    }
  }

  public resume(): void {
    try {
      this.send({
        op: OPCode.RECONNECT,
        d: {
          token: this.client.token,
          session_id: this._sessionId,
          seq: this._lastSeq,
        },
      });

      this.status = Status.CONNECTING;
    } catch (err) {
      throw new Error(
        `[SHARD ${this.id}] Resume failed.\n${err.stack || err.message}`
      );
    }
  }

  public async reconnect(): Promise<void> {
    try {
      if (this._sessionId === null)
        await this.client.shards._handleIndentifyLimit();

      this.destroy();
      this.status = Status.RECONNECTING;
      this.spawn();

      if (!this._sessionId)
        log(
          `SHARD ${this.id}`,
          "Reconnect failed. No session ID found. Trying to identify..."
        );

      this.emit(InternalEvents.SHARD_RECONNECT, this);
    } catch (err) {
      log(`SHARD ${this.id}`, `${err.stack || err.message}`, "ERR");
    }
  }
}

export { Shard };
