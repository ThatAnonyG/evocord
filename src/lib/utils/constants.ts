import { PresenseStatus } from "@/lib/structures/discord/Presense";
import { IActivity } from "../structures/discord/Activity";
import { Channel } from "../structures/discord/Channel";
import { User } from "../structures/discord/User";

export const API = "https://discord.com/api/v8";

export interface Payload {
  op: OPCode;
  d: Record<string, unknown>;
  s?: number | null;
  t?: GatewayEvents | null;
}

export interface ClientOptions {
  intents: Intents[];
  shardAmount?: number | "auto";
  presense?: {
    since: number | null;
    activities: IActivity[] | null;
    status: PresenseStatus | "invisible";
    afk: boolean;
  };
  readyTimeout?: number;
  retryLimits?: {
    rest?: number;
  };
}

export interface APIRequest {
  endpoint: string;
  method: typeof HTTPMethods[number];
  reqOptions?: APIRequestOptions;
}

export interface APIRequestOptions {
  body?: GenericObj;
  files?: { file: string; name: string }[];
}

export enum OPCode {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  PRESENSE_UPDATE = 3,
  VOICE_STATE_UPDATE = 4,
  RESUME = 6,
  RECONNECT = 7,
  REQUEST_GUILD_MEMBER = 8,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11,
}

export enum Status {
  READY = 0,
  CONNECTING = 1,
  RECONNECTING = 2,
  DISCONNECTED = 3,
  WAITING_GUILDS = 4,
}

export enum InternalEvents {
  // Shard
  SHARD_READY = "shardReady",
  SHARD_RECONNECT = "shardReconnect",
  SHARD_CLOSE = "shardClose",
  SHARD_ERROR = "shardError",

  // Client
  SHARD_DESTROY_ALL = "shardDestroyAll",
}

export enum Intents {
  GUILDS = 1 << 0,
  GUILD_MEMBERS = 1 << 1,
  GUILD_BANS = 1 << 2,
  GUILD_EMOJIS = 1 << 3,
  GUILD_INTEGRATIONS = 1 << 4,
  GUILD_WEBHOOKS = 1 << 5,
  GUILD_INVITES = 1 << 6,
  GUILD_VOICE_STATES = 1 << 7,
  GUILD_PRESENCES = 1 << 8,
  GUILD_MESSAGES = 1 << 9,
  GUILD_MESSAGE_REACTIONS = 1 << 10,
  GUILD_MESSAGE_TYPING = 1 << 11,
  DIRECT_MESSAGES = 1 << 12,
  DIRECT_MESSAGE_REACTIONS = 1 << 13,
  DIRECT_MESSAGE_TYPING = 1 << 14,
}

export enum Events {
  READY = "ready",

  CHANNEL_CREATE = "channelCreate",
  CHANNEL_UPDATE = "channnelUpdate",
  CHANNEL_DELETE = "channelDelete",
  CHANNEL_PINS_UPDATE = "channelPinsUpdate",

  GUILD_CREATE = "guildCreate",
  GUILD_UPDATE = "guildUpdate",
  GUILD_DELETE = "guildDelete",
  GUILD_BAN_ADD = "guildBanAdd",
  GUILD_BAN_REMOVE = "guildBanRemove",
  GUILD_EMOJIS_UPDATE = "guildEmojisUpdate",
  GUILD_MEMBER_ADD = "guildMemberAdd",
  GUILD_MEMBER_REMOVE = "guildMemberRemove",
  GUILD_MEMBER_UPDATE = "guildMemberUpdate",
  GUILD_MEMBERS_CHUNK = "guildMembersChunk",
  GUILD_ROLE_CREATE = "guildRoleCreate",
  GUILD_ROLE_UPDATE = "guildRoleUpdate",
  GUILD_ROLE_DELETE = "guildRoleDelete",

  INVITE_CREATE = "inviteCreate",
  INVITE_DELETE = "inviteDelete",

  MESSAGE_CREATE = "messageCreate",
  MESSAGE_UPDATE = "messageUpdate",
  MESSAGE_DELETE = "messageDelete",
  MESSAGE_DELETE_BULK = "messageDeleteBulk",
  MESSAGE_REACTION_ADD = "messageReactionAdd",
  MESSAGE_REACTION_REMOVE = "messageReactionRemove",
  MESSAGE_REACTION_REMOVE_ALL = "messageReactionRemoveAll",
  MESSAGE_REACTION_REMOVE_EMOJI = "messageReactionRemoveEmoji",

  PRESENCE_UPDATE = "presenceUpdate",
  TYPING_START = "typingStart",
  USER_UPDATE = "userUpdate",
}

export type GatewayEvents = keyof typeof Events;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericObj = Record<string, any>;

export type Extendable = User | Channel;

export const FATAL_CODES = [1000, 4004, 4010, 4011, 4013, 4014];

export const Ratelimit = {
  IDENTIFY: { resetsAfter: 5.5 * 1000 },
  GATEWAY: { commands: 120, resetsAfter: 60 * 1000 },
  REST: { limit: 10000, resetsAfter: 10 * 60 * 1000 },
};

export const HTTPMethods = ["get", "post", "delete", "put", "patch"] as const;
