import { Client } from "@/core/Client";
import { Channel, IChannnel } from "./Channel";

export interface IGuildChannel extends IChannnel {
  guildId: string;
  position: number;
  permissionOverwrites: [];
  name: string;
}

export class GuildChannel extends Channel implements IGuildChannel {
  public guildId: string;
  public position: number;
  public permissionOverwrites;
  public name: string;

  constructor(client: Client, data: IGuildChannel) {
    super(client, { id: data.id, type: data.type });

    this.guildId = data.guildId;
    this.position = data.position;
    this.permissionOverwrites = data.permissionOverwrites;
    this.name = data.name;
  }
}
