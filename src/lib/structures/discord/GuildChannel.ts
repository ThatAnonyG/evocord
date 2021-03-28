import { Client } from "@/core/Client";
import { BaseStructure } from "../internal/BaseStructure";
import { Guild } from "./Guild";

export class GuildChannel extends BaseStructure {
  public guild: Guild;

  constructor(client: Client) {
    super(client);
  }
}
