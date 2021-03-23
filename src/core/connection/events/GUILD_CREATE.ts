import { Shard } from "../Shard";
import { GenericObj } from "@/lib/utils/constants";

export function handler(this: Shard, data: GenericObj): void {
  this.unavailableGuilds.delete(data.id);
  return;
}
