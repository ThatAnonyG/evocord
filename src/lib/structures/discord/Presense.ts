import { Client } from "@/core/Client";
import { BaseStructure } from "../internal/BaseStructure";
import { Activity, IActivity } from "./Activity";
import { IUser } from "./User";

export type PresenseStatus = "online" | "dnd" | "idle" | "offline";

export interface IPresense {
  user: IUser | string;
  guildId: string;
  status: PresenseStatus;
  activities: IActivity[];
  clientStatus: {
    desktop?: string;
    mobile?: string;
    web?: string;
  };
}

export class Presense extends BaseStructure implements IPresense {
  public user: string;
  public guildId: string;
  public status: PresenseStatus;
  public activities: Activity[];
  public clientStatus: {
    desktop?: string | undefined;
    mobile?: string | undefined;
    web?: string | undefined;
  };

  constructor(client: Client, data: IPresense) {
    super(client);

    this.user = data.user as string;
    this.guildId = data.guildId;
    this.status = data.status;
    this.clientStatus = data.clientStatus;
    this.activities = [];

    for (const activity of data.activities)
      this.activities.push(new Activity(client, activity));
  }
}
