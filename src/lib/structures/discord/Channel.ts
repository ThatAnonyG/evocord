import { Client } from "@/core/Client";
import { GenericObj } from "@/lib/utils/constants";
import { BaseStructure } from "../internal/BaseStructure";
import { DMChannel, IDMChannel } from "./DMChannel";

export interface IChannnel {
  id: string;
  type: ChannelType;
}

export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,
}

export class Channel extends BaseStructure implements IChannnel {
  public id: string;
  public type: ChannelType;

  constructor(client: Client, data: IChannnel) {
    super(client);

    this.id = data.id;
    this.type = data.type;

    if (this._cache) BaseStructure.cacheAdd(client, "channel", this);
  }

  public toString(): string {
    return `<#${this.id}>`;
  }

  public static parseType(data: GenericObj, client: Client): unknown {
    switch (data.type as ChannelType) {
      case ChannelType.DM:
        return new DMChannel(client, data as IDMChannel);

      case ChannelType.GUILD_CATEGORY:
        return;

      case ChannelType.GUILD_NEWS:
        return;

      case ChannelType.GUILD_STORE:
        return;

      case ChannelType.GUILD_TEXT:
        return;

      case ChannelType.GUILD_VOICE:
        return;
    }

    return new Channel(client, { id: data.id, type: data.type });
  }
}
