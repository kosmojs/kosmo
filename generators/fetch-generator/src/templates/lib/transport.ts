import backend from "virtual:kosmo/backend-app";

import type { FetchApp, NodeApp } from "@kosmojs/core";
import type { HTTPError, Transport } from "@kosmojs/core/fetch";
import { createDispatch } from "@kosmojs/core/fetch/transport";

import {
  redirectCodes,
  ssrOrigin,
  store,
} from "{{ createImport 'libCore' 'ssr' }}";

const maxRedirects = 5;

const headersProvider = () => {
  return store.getStore()?.headers;
};

const createTransport = (app: FetchApp | NodeApp): Transport => {
  const dispatch = createDispatch(app);

  /**
   * Build a fetch-compatible transport that dispatches requests
   * directly into the given app - no sockets, no interception.
   * Redirects are followed in-process, including the 303 and 301/302 method rewrite to GET.
   * */
  return {
    requestHandler: async (input, init) => {
      /**
       * Request-scoped headers act as defaults: anything set explicitly
       * on the call itself wins over forwarded values.
       * */
      const headers = new Headers(init?.headers);

      /**
       * When the body is FormData, the Request constructor sets a multipart Content-Type with a fresh boundary.
       * A forwarded Content-Type default would override that boundary and desync it from the serialized body,
       * so never forward Content-Type for FormData bodies.
       * */
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
       * Bodies are buffered once so they can be replayed across 307/308 hops;
       * the client only ever sends strings, FormData and buffer-ish payloads, so this is safe and cheap.
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
    },
    responseHandler: async ({ body, response }) => {
      // Create enhanced error object for HTTP errors
      let error = new Error(response.statusText) as HTTPError;

      if (response.ok) {
        if (body instanceof Error) {
          // response parsing failed, rethrow
          error = body as never;
        } else {
          return body;
        }
      } else {
        error.body = body as never;
      }

      error.response = response;

      const storage = store.getStore();

      if (storage) {
        // Capture the fetch error at the transport level and stash it on the request store.
        // Some frameworks - Solid notably - swallow a rejecting loader and still emit a partial render tree.
        // Storing the error here keeps it observable regardless of how the framework handles the loader rejection.
        storage.error = error;
      }

      throw error;
    },
  };
};

export default backend ? createTransport(backend) : undefined;
