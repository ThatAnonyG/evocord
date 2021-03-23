import { Client } from "@/core/Client";
import { BaseStructure } from "../internal/BaseStructure";

export interface IUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;

  bot?: boolean;
  system?: boolean;
  mfaEnabled?: boolean;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  // flags?: UserFlags;
  premiumType?: Premium;
  // publicFlags?: UserFlags;
}

export enum Premium {
  NONE = 0,
  CLASSIC = 1,
  NITRO = 2,
}

export class User extends BaseStructure implements IUser {
  public id: string;
  public username: string;
  public discriminator: string;
  public avatar: string | null;
  public bot?: boolean;
  public system?: boolean;
  public mfaEnabled?: boolean;
  public locale?: string;
  public verified?: boolean;
  public email?: string;
  public premiumType?: Premium;

  constructor(public client: Client, data: IUser) {
    super();

    this.id = data.id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar;

    const presentOptionalData = this._parseOptionalData.call(this, data);
    const keys = Object.keys(presentOptionalData) as (keyof IUser)[];

    if (keys.length)
      for (const key of keys) this[key] = presentOptionalData[key] as never;
  }
}
