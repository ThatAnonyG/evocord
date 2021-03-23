/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIRequestOptions, HTTPMethods } from "@/lib/utils/constants";
import { RestCore } from "./RestCore";

const emptyFunc = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export function buildRoute(core: RestCore): any {
  const route = [""];
  const handler = {
    get(_: () => void, name: string): any {
      if (HTTPMethods.includes(name as typeof HTTPMethods[number])) {
        return async (options?: APIRequestOptions) =>
          await core.request({
            endpoint: route.join("/"),
            method: name as typeof HTTPMethods[number],
            reqOptions: options,
          });
      }
      route.push(name);
      return new Proxy(emptyFunc, handler);
    },
    apply(_: () => void, __: string, args: string[]): any {
      route.push(...args.filter((x) => x !== null));
      return new Proxy(emptyFunc, handler);
    },
  };

  return new Proxy(emptyFunc, handler);
}
