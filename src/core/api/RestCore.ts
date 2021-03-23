import { API, APIRequest, GenericObj } from "@/lib/utils/constants";
import { log } from "@/lib/utils/utils";
import fetch from "node-fetch";
import { Client } from "../Client";
import { RestHandler } from "./RestHandler";
import { buildRoute } from "./RouteBuilder";

class RestCore {
  private handler = new RestHandler();

  constructor(public client: Client, public type: "Bot" = "Bot") {}

  public get authHeader(): string {
    return `${this.type} ${this.client.token}`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public get api(): any {
    return buildRoute(this);
  }

  public async request({
    endpoint,
    method,
    reqOptions,
  }: APIRequest): Promise<GenericObj> {
    if (this.handler.globalTimeout) {
      await this.handler.globalTimeout;
      this.handler.globalTimeout = null;
    }

    log(`REST`, `Path: ${endpoint}`);

    const { version, homepage } = require("@/../package.json"); // eslint-disable-line @typescript-eslint/no-var-requires
    const options = {
      method: method,
      headers: {
        "User-Agent": `DiscordBot (${homepage}, ${version})`,
        Authorization: this.authHeader,
      },
    };

    if (method !== "get" && reqOptions?.body)
      Object.defineProperty(options, "body", reqOptions.body);

    const res = await fetch(`${API}${endpoint}`, options);

    await this.handler._handleInvalidReq(res);
    return await this.handler._handleRes(res);
  }
}

export { RestCore };
