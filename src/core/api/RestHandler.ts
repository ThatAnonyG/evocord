import { Store } from "@/lib/structures/internal/Store";
import { GenericObj, Ratelimit } from "@/lib/utils/constants";
import { log, sleep } from "@/lib/utils/utils";
import { Response } from "node-fetch";

class RestHandler {
  private ratelimitInfo = new Store<
    string,
    {
      limit: number;
      remaining: number;
      reset: number;
      resetAfter: number;
      timeout: Promise<void> | null;
    }
  >();
  private invalidReqLimit: {
    remaining: number;
    timeout: Promise<void> | null;
    reset: NodeJS.Timeout | null;
    resetsAt: number;
  } = {
    remaining: Ratelimit.REST.limit,
    timeout: null,
    reset: null,
    resetsAt: -1,
  };
  public globalTimeout: Promise<void> | null = null;

  public async _handleRes(res: Response): Promise<GenericObj> {
    const ratelimitHeaders = {
      limit: parseInt(res.headers.get("x-ratelimit-limit") || "-1"),
      remaining: parseInt(res.headers.get("x-ratelimit-remaining") || "-1"),
      reset: parseInt(res.headers.get("x-ratelimit-reset") || "-1"),
      resetAfter:
        parseInt(res.headers.get("x-ratelimit-reset-after") || "-1") * 1000,
    };

    const bucket = res.headers.get("x-ratelimit-bucket");
    const handler = bucket
      ? this.ratelimitInfo
          .set(bucket, {
            timeout: null,
            ...ratelimitHeaders,
          })
          .get(bucket)
      : null;

    if (res.headers.get("x-ratelimit-global")) {
      log(
        `REST_RATELIMIT`,
        `Globally ratelimited on ${res.url}. Preparing to wait until reset.`
      );
      this.globalTimeout = sleep(ratelimitHeaders.resetAfter);
      await this.globalTimeout;
      this.globalTimeout = null;
    }

    if (handler && handler.timeout) {
      await handler.timeout;
    } else if (handler && handler.remaining <= 0) {
      log(
        `REST_RATELIMIT`,
        `Ratelimit reached on ${res.url}. Preparing to wait until reset.`
      );
      handler.timeout = sleep(handler.resetAfter);
      await handler.timeout;
      handler.timeout = null;
    }

    return await res.json();
  }

  public async _handleInvalidReq(res: Response): Promise<void> {
    if (/401|403|429/gi.test(res.status.toString()))
      this.invalidReqLimit.remaining--;

    if (this.invalidReqLimit.timeout) await this.invalidReqLimit.timeout;

    if (this.invalidReqLimit.resetsAt <= Date.now()) {
      this.invalidReqLimit.remaining = Ratelimit.REST.limit;
      this.invalidReqLimit.timeout = null;
      this.invalidReqLimit.resetsAt = Date.now() + Ratelimit.REST.resetsAfter;
    }

    if (this.invalidReqLimit.remaining <= 0) {
      this.invalidReqLimit.timeout = sleep(
        this.invalidReqLimit.resetsAt - Date.now()
      );
      await this.invalidReqLimit.timeout;
      this.invalidReqLimit.timeout = null;
    }
  }
}

export { RestHandler };
