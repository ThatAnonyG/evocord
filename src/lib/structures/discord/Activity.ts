import { Client } from "@/core/Client";
import { BaseStructure } from "../internal/BaseStructure";

export interface IActivity {
  name: string;
  type: ActivityType;
  url?: string | null;
  createdAt: number;
  timestamps?: {
    start: number;
    end: number;
  };
  applicationId?: string;
  details?: string | null;
  state?: string | null;
  emoji?: {
    name: string;
    id?: string;
    animated?: boolean;
  } | null;
  party?: {
    id?: string;
    size?: [number, number];
  };
  assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
  secrets?: {
    join?: string;
    spectate?: string;
    match?: string;
  };
  instance?: boolean;
  flags?: ActivityFlags[];
}

export enum ActivityType {
  GAME = 0,
  STREAMING = 1,
  LISTENING = 2,
  CUSTOM = 4,
  COMPETING = 5,
}

export enum ActivityFlags {
  INSTANCE = 1 << 0,
  JOIN = 1 << 1,
  SPECTATE = 1 << 2,
  JOIN_REQUEST = 1 << 3,
  SYNC = 1 << 4,
  PLAY = 1 << 5,
}

export class Activity extends BaseStructure implements IActivity {
  public name: string;
  public type: ActivityType;
  public url?: string | null;
  public createdAt: number;
  public timestamps?: { start: number; end: number };
  public applicationId?: string;
  public details?: string | null;
  public state?: string | null;
  public emoji?: { name: string; id?: string; animated?: boolean } | null;
  public party?: { id?: string; size?: [number, number] };
  public assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
  public secrets?: { join?: string; spectate?: string; match?: string };
  public instance?: boolean;
  public flags?: ActivityFlags[];

  constructor(public client: Client, data: IActivity) {
    super();

    this.name = data.name;
    this.type = data.type;
    this.createdAt = data.createdAt;

    const presentOptionalData = this._parseOptionalData.call(this, data);
    const keys = Object.keys(presentOptionalData) as (keyof IActivity)[];

    if (keys.length)
      for (const key of keys) this[key] = presentOptionalData[key] as never;
  }
}
