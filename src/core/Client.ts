import { ShardManager } from "@/core/connection/ShardManager";
import { User } from "@/lib/structures/discord/User";
import { ClientOptions } from "@/lib/utils/constants";
import EventEmitter from "events";
import { RestCore } from "./api/RestCore";

class Client extends EventEmitter {
  public shards = new ShardManager(this);
  public rest = new RestCore(this);
  public user?: User;

  public readyTimestamp = -1;

  constructor(private _token: string, public options: ClientOptions) {
    super();
    if (!this.options.shardAmount) this.options.shardAmount = "auto";
  }

  public get token(): string {
    return this._token;
  }

  public async init(): Promise<void> {
    await this.shards.spawnAll();
  }
}

export { Client };
