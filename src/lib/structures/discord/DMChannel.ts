import { Client } from "@/core/Client";
import { Channel, IChannnel } from "./Channel";
import { IUser, User } from "./User";

export interface IDMChannel extends IChannnel {
  lastMessageId: string | null;
  recipients: IUser[];
  lastPinTimestamp: string | null;
}

export class DMChannel extends Channel implements IDMChannel {
  public lastMessageId: string | null;
  public recipients: User[];
  public lastPinTimestamp: string | null;

  constructor(client: Client, data: IDMChannel) {
    super(client, data);

    this.lastMessageId = data.lastMessageId;
    this.recipients = [];
    this.lastPinTimestamp = data.lastPinTimestamp;

    for (const user of data.recipients)
      this.recipients.push(new User(client, user));

    this._parseOptionalData.call(this, data);
  }
}
