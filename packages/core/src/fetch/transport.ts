import { inject } from "light-my-request";

import type { FetchApp, NodeApp } from "../types";

/**
 * Minimal transport contract: the call signature of fetch, without
 * its runtime-specific statics (Bun's typeof fetch, for instance,
 * carries a required preconnect property). The client only ever
 * calls the transport, so the call signature is the whole contract;
 * the global fetch remains assignable to it.
 * */
export type Transport = {
  requestHandler: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response>;
  responseHandler?: (a: {
    body: unknown;
    response: Response;
  }) => Promise<unknown>;
};

export const createDispatch = (app: FetchApp | NodeApp) => {
  if (typeof (app as FetchApp).fetch === "function") {
    return (app as FetchApp).fetch;
  }

  return async (request: Request) => {
    // Node dispatch: serializes the web Request into light-my-request's injection format
    // and lifts the injected response back into a web Response.
    const url = new URL(request.url);

    const payload = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : Buffer.from(await request.arrayBuffer());

    const result = await inject((app as NodeApp).callback(), {
      method: request.method as never,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers),
      ...(payload?.length ? { payload } : {}),
    });

    const headers = new Headers();

    for (const [key, value] of Object.entries(result.headers)) {
      for (const entry of Array.isArray(value) ? value : [value]) {
        if (entry !== undefined) {
          headers.append(key, String(entry));
        }
      }
    }

    // 204/304 responses must not carry a body
    const body = [204, 304].includes(result.statusCode)
      ? null
      : new Uint8Array(result.rawPayload);

    return new Response(body, {
      status: result.statusCode,
      statusText: result.statusMessage,
      headers,
    });
  };
};
