import { Store } from "@/lib/structures/internal/Store";
import { Shard } from "@/core/connection/Shard";
import {
  Events,
  InternalEvents,
  Ratelimit,
  Status,
} from "@/lib/utils/constants";
import { log, sleep } from "@/lib/utils/utils";
import { Client } from "@/core/Client";

interface IStartLimit {
  total: number;
  remaining: number;
  reset_after: number;
}

class ShardManager extends Store<number, Shard> {
  public shardQueue = new Set<Shard>();
  public destroyed = false;
  public ready = false;
  private _startLimitData: IStartLimit = {
    total: -1,
    remaining: -1,
    reset_after: -1,
  };

  constructor(public client: Client) {
    super();
  }

  public get allShardsReady(): boolean {
    return !this.some((s) => s.status !== Status.READY);
  }

  public async respawn(shard: Shard): Promise<void> {
    const {
      url: gatewayUrl,
      session_start_limit: startLimit,
    }: {
      url: string;
      session_start_limit: IStartLimit;
    } = await this.client.rest.api.gateway.bot.get();

    this._startLimitData = startLimit;
    await this._handleIndentifyLimit(this._startLimitData);

    shard.destroy();
    if (this.shardQueue.has(shard)) this.shardQueue.delete(shard);

    shard = new Shard(this.client, shard.id);
    shard.gateway = gatewayUrl;

    this.shardQueue.add(shard);
    await this.processQueue();
  }

  public async spawnAll(): Promise<void> {
    const {
      url: gatewayUrl,
      shards: recommendedShardLimit,
      session_start_limit: startLimit,
    }: {
      url: string;
      shards: number;
      session_start_limit: IStartLimit;
    } = await this.client.rest.api.gateway.bot.get();

    this._startLimitData = startLimit;

    if (this.client.options.shardAmount === "auto")
      this.client.options.shardAmount = recommendedShardLimit;

    await this._handleIndentifyLimit(this._startLimitData);

    const shardNum = this.client.options.shardAmount as number;
    const shards = Array.from({ length: shardNum }, (_, i) => i);

    this.shardQueue = new Set(
      shards
        .filter((i) => !isNaN(i) && i >= 0 && i < Infinity)
        .map((i) => {
          const shard = new Shard(this.client, i);
          shard.gateway = `${gatewayUrl}?v=8&encoding=json`;
          return shard;
        })
    );

    await this.processQueue();
  }

  public async processQueue(): Promise<void> {
    for (const shard of this.shardQueue) {
      try {
        log(`SHARD_MAN`, `Spawning shard ${shard.id}`);

        this.shardQueue.delete(shard);
        this.set(shard.id, shard);

        await shard.spawn();

        if (this.shardQueue.size > 0)
          await sleep(Ratelimit.IDENTIFY.resetsAfter);
      } catch (err) {
        if (err) log(`SHARD_MAN`, `${err.stack || err.message}`, "ERR");
        else {
          log(`SHARD_MAN`, `Error in shard spawning. Enqueuing again...`);
          this.shardQueue.add(shard);
        }
      }
    }
  }

  public destroy(): void {
    this.destroyed = true;

    for (const shard of this.values()) shard.destroy();

    this.clear();
    this.shardQueue.clear();

    this.client.emit(InternalEvents.SHARD_DESTROY_ALL, this);
  }

  public async _handleIndentifyLimit(data?: IStartLimit): Promise<void> {
    let startLimit: IStartLimit;

    if (!data) {
      const {
        session_start_limit,
      } = await this.client.rest.api.gateway.bot.get();
      startLimit = session_start_limit;
    } else startLimit = data;

    const { total, remaining, reset_after } = startLimit;

    log(
      `SHARD_MAN`,
      `
Session start limit information:
Total: ${total}
Remaining: ${remaining}
Reset After: ${reset_after}`
    );

    if (!remaining) {
      log(
        `SHARD_MAN`,
        `Pausing identifies until limit resets. Sleep for ${reset_after}ms.`
      );
      await sleep(reset_after);
    }
  }

  public _validateStatus(): void {
    if (this.ready) return;
    if (!this.allShardsReady || this.shardQueue.size > 0) return;

    this.ready = true;
    this.client.readyTimestamp = Date.now();
    this.client.emit(Events.READY);
  }
}

export { ShardManager };
