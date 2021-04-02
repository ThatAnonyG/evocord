/* eslint-disable */
import { Client } from "@/core/Client";
import { GenericObj } from "@/lib/utils/constants";
import { Channel } from "../discord/Channel";
import { Guild } from "../discord/Guild";
import { User } from "../discord/User";

class BaseStructure {
  constructor(public client: Client, protected _cache = true) {}

  public _parseOptionalData(this: any, data: GenericObj): void {
    for (const key of Object.keys(data)) {
      if (typeof this[key] !== "undefined" && this[key] !== null) continue;
      if (typeof data[key] !== "undefined" && data[key] !== null)
        this[key] = data[key];
    }
  }

  public static cacheAdd<K extends keyof Cacheable>(
    client: Client,
    cacheType: K,
    data: Cacheable[K]
  ) {
    return data;
  }
}

interface Cacheable {
  guild: Guild;
  user: User;
  channel: Channel;
}

export { BaseStructure };
