import { inject } from "light-my-request";

import type { FetchApp, NodeApp } from "@kosmojs/core";
import type { Transport } from "@kosmojs/core/fetch";

import {
  isFetchApp,
  maxRedirects,
  redirectCodes,
  ssrOrigin,
  store,
} from "./base";

import { apiApp } from "{{ createImport 'lib' '@ssr/api' }}";

/**
 * HeadersProvider for createTransport.
 * */
const headersProvider = (): HeadersInit | undefined => {
  return store.getStore()?.headers;
};

const createDispatch = (app: FetchApp | NodeApp) => {
  return isFetchApp(app)
    ? app.fetch
    : async (request: Request): Promise<Response> => {
        /**
         * Node dispatch: serializes the web Request into light-my-request's
         * injection format and lifts the injected response back into a web Response.
         * */
        const url = new URL(request.url);

        const payload = ["GET", "HEAD"].includes(request.method)
          ? undefined
          : Buffer.from(await request.arrayBuffer());

        const result = await inject(app.callback() as never, {
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

        /**
         * 204/304 responses must not carry a body per the Response
         * constructor contract.
         * */
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

const createTransport = (app: FetchApp | NodeApp): Transport => {
  const dispatch = createDispatch(app);

  /**
   * Build a fetch-compatible transport that dispatches requests
   * directly into the given app - no sockets, no interception.
   * Redirects are followed in-process, including the 303 and 301/302 method rewrite to GET.
   * */
  return async (input, init) => {
    /**
     * Request-scoped headers act as defaults: anything set explicitly
     * on the call itself wins over forwarded values.
     * */
    const headers = new Headers(init?.headers);

    // When the body is FormData, the Request constructor sets a multipart
    // Content-Type with a fresh boundary. A forwarded Content-Type default would
    // override that boundary and desync it from the serialized body, so never
    // forward Content-Type for FormData bodies.
    const isFormBody = init?.body instanceof FormData;

    for (const [key, value] of new Headers(headersProvider() || undefined)) {
      if (isFormBody && key.toLowerCase() === "content-type") {
        continue;
      }
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    }

    let request = new Request(new URL(String(input), ssrOrigin), {
      ...init,
      headers,
    });

    /**
     * Bodies are buffered once so they can be replayed across
     * 307/308 hops; the client only ever sends strings, FormData
     * and buffer-ish payloads, so this is safe and cheap.
     * */
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer();

    for (let hop = 0; ; hop++) {
      if (hop === maxRedirects) {
        throw new TypeError("Failed to fetch: too many redirects");
      }

      const response = await dispatch(
        body === undefined || request.method === "GET"
          ? new Request(request, { body: null })
          : new Request(request, { body }),
      );

      const location = response.headers.get("location");

      if (!location || !redirectCodes.includes(response.status)) {
        return response;
      }

      const method =
        response.status === 303 ||
        ([301, 302].includes(response.status) && request.method === "POST")
          ? "GET"
          : request.method;

      request = new Request(new URL(location, request.url), {
        method,
        headers: request.headers,
      });
    }
  };
};

const ssrTransport = apiApp ? createTransport(apiApp) : undefined;

export const transport = ssrTransport
  ? async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const response = await ssrTransport(input, init);
        if (response?.ok) {
          return response;
        }
        // the rethrow here needed cause ssrTransport does not throw on non-2xx responses
        throw new SSRFetchError([
          input,
          response,
          typeof response?.text === "function"
            ? await response.text()
            : response?.statusText,
        ]);
      } catch (error) {
        /**
         * Capture the fetch error at the transport level and stash it on the request store.
         * Some frameworks - Solid notably - swallow a rejecting loader and still emit a partial render tree.
         * Storing the error here keeps it observable regardless of how the framework handles the loader rejection.
         * */
        const storage = store.getStore();
        if (storage) {
          storage.error = error;
        }
        throw error;
      }
    }
  : undefined; // let fetch clients pick the transport

class SSRFetchError extends Error {
  constructor([input, response, message]: [
    input: RequestInfo | URL,
    response: Response,
    message: string | undefined,
  ]) {
    const pathname = pathnameOf(input);
    const status = response.status ?? "unknown";
    super(`${pathname}: ${status} [ ${message} ]`.trim());
    this.name = "SSRFetchError";
  }
}

const pathnameOf = (input: RequestInfo | URL): string => {
  try {
    if (typeof input === "string") {
      return new URL(input, "http://x").pathname;
    }
    if (input instanceof URL) {
      return input.pathname;
    }
    if (input instanceof Request) {
      return new URL(input.url).pathname;
    }
  } catch {}
  return String(input);
};
