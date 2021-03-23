import { IActivity } from "./Activity";

type PresenseStatus = "online" | "dnd" | "idle" | "invisible" | "offline";

export interface IPresense {
  since: number | null;
  activities: IActivity[] | null;
  status: PresenseStatus;
  afk: boolean;
}
