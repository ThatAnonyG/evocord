import { User } from "@/lib/structures/discord/User";
import { Shard } from "../Shard";
import { GenericObj, Status } from "@/lib/utils/constants";
import { log } from "@/lib/utils/utils";

let readyTimeout: NodeJS.Timeout | null = null;

export function handler(this: Shard, data: GenericObj): void {
  if (readyTimeout) clearTimeout(readyTimeout);
  readyTimeout = null;

  this._sessionId = data.sessionId;
  this.unavailableGuilds = new Set(
    data.guilds.map(({ id }: { id: string }) => id)
  );
  this.status = Status.WAITING_GUILDS;

  const user = new User(this.client, data.user);
  this.client.user = user;

  if (!this.unavailableGuilds.size) {
    log(`READY`, `No more unavailable guilds left.`);
    this.status = Status.READY;
    this.client.shards._validateStatus();
    return;
  }

  readyTimeout = setTimeout(() => {
    log(`READY`, `Unavailable guilds left: ${this.unavailableGuilds.size}`);
    this.status = Status.READY;
    this.client.shards._validateStatus();
  }, this.client.options.readyTimeout || 20000);
}
