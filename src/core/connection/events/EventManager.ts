import { Store } from "@/lib/structures/internal/Store";
import { GenericObj, GatewayEvents } from "@/lib/utils/constants";
import { log, normalizeName } from "@/lib/utils/utils";
import { resolve } from "path";
import { Shard } from "../Shard";

class EventManager {
  public manager = new Store<
    GatewayEvents,
    (this: Shard, data: GenericObj) => void
  >();

  constructor(public shard: Shard) {
    this.register("READY");
    this.register("CHANNEL_CREATE");
    this.register("CHANNEL_UPDATE");
    this.register("CHANNEL_DELETE");
    this.register("CHANNEL_PINS_UPDATE");
    this.register("GUILD_CREATE");
    this.register("GUILD_UPDATE");
    this.register("GUILD_DELETE");
    this.register("GUILD_BAN_ADD");
    this.register("GUILD_BAN_REMOVE");
    this.register("GUILD_EMOJIS_UPDATE");
    this.register("GUILD_MEMBER_ADD");
    this.register("GUILD_MEMBER_REMOVE");
    this.register("GUILD_MEMBER_UPDATE");
    this.register("GUILD_MEMBERS_CHUNK");
    this.register("GUILD_ROLE_CREATE");
    this.register("GUILD_ROLE_UPDATE");
    this.register("GUILD_ROLE_DELETE");
    this.register("INVITE_CREATE");
    this.register("INVITE_DELETE");
    this.register("MESSAGE_CREATE");
    this.register("MESSAGE_UPDATE");
    this.register("MESSAGE_DELETE");
    this.register("MESSAGE_DELETE_BULK");
    this.register("MESSAGE_REACTION_ADD");
    this.register("MESSAGE_REACTION_REMOVE");
    this.register("MESSAGE_REACTION_REMOVE_ALL");
    this.register("MESSAGE_REACTION_REMOVE_EMOJI");
    this.register("PRESENCE_UPDATE");
    this.register("TYPING_START");
    this.register("USER_UPDATE");
  }

  public register(name: GatewayEvents): void {
    const sendErr = (err: Error) =>
      log(
        `SHARD ${this.shard.id} (EVT_MANAGER)`,
        `
Failed to register event handler.
Event: ${name}
Tried handler path: ${resolve(__dirname, `${name}.ts`)}
${err.stack || err.message}`,
        "ERR"
      );

    import(resolve(__dirname, name))
      .then(
        ({ handler }: { handler: (this: Shard, data: GenericObj) => void }) => {
          if (!handler) return sendErr(new Error("No handler found."));
          this.manager.set(name, handler);
          log(
            `SHARD ${this.shard.id} (EVT_MANAGER)`,
            `Registered handler for event: ${name}`
          );
        }
      )
      .catch((err) => sendErr(err));
  }

  public _parseData(data: GenericObj): GenericObj {
    const builder: GenericObj = {};
    const keys = Object.keys(data);

    for (const key of keys) {
      if (Object.prototype.toString.call(data[key]).slice(8, -1) === "Object") {
        builder[normalizeName(key)] = this._parseData(data[key]);
        continue;
      }
      builder[normalizeName(key)] = data[key];
    }

    return builder;
  }
}

export { EventManager };
