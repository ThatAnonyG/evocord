import { Client } from "@/core/Client";
import { BaseStructure } from "../internal/BaseStructure";
import { Guild, IGuild } from "./Guild";
import { IUser, User } from "./User";

export interface ITemplate {
  code: string;
  name: string;
  description: string | null;
  usageCount: number;
  creatorId: string;
  creator: IUser;
  createdAt: number;
  updatedAt: number;
  sourceGuildId: string;
  serializedSourceGuild: IGuild;
  isDirty: boolean | null;
}

export class Template extends BaseStructure implements ITemplate {
  public code: string;
  public name: string;
  public description: string | null;
  public usageCount: number;
  public creatorId: string;
  public creator: User;
  public createdAt: number;
  public updatedAt: number;
  public sourceGuildId: string;
  public serializedSourceGuild: Guild;
  public isDirty: boolean | null;

  constructor(client: Client, data: ITemplate) {
    super(client);

    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.usageCount = data.usageCount;
    this.creatorId = data.creatorId;
    this.creator = new User(client, data.creator);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.sourceGuildId = data.sourceGuildId;
    this.serializedSourceGuild = new Guild();
    this.isDirty = data.isDirty;
  }
}
