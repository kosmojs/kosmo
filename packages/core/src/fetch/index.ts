import { stringifySearchParams as defaultStringifySearchParams } from "../generic";
import type {
  FetchMapper,
  FetchMethod,
  HTTPError,
  HTTPMethod,
  Options,
} from "./types";

export * from "./types";
export * from "./utils";

// HTTP methods that typically don't include a request body
const bodylessMethods = ["GET", "DELETE"];

/**
 * Main factory function that creates a configured fetch client instance.
 * The transport defaults to the global fetch.
 * SSR builds pass a transport that dispatch into a Hono/Koa app.
 * Hydrating clients pass a transport with dedupe logic.
 * Keeping the factory transport-agnostic keeps server-only modules out of
 * browser bundles.
 * */
export default (base: string | URL, factoryOpts?: Options): FetchMapper => {
  // Factory function that creates HTTP method implementations
  function factory(method: HTTPMethod): FetchMethod {
    return async (...args: Partial<Parameters<FetchMethod>>) => {
      const [path, data, opts] = args;

      const {
        stringifySearchParams = defaultStringifySearchParams,
        transport = globalThis.fetch,
        responseMode = "json",
        ...fetchOpts // Remaining options passed directly to fetch
      } = {
        ...factoryOpts,
        ...opts,
      };

      // Construct URL from base and path segments
      const url = [
        String(base),
        ...(Array.isArray(path)
          ? path.flat()
          : ["string", "number"].includes(typeof path)
            ? [path] // Wrap single value in array
            : []), // No path provided
      ].join("/");

      // Normalize headers to Headers instance for consistent API
      const headers = new Headers({
        ...(data?.headers instanceof Headers
          ? Object.fromEntries(data.headers.entries()) // Convert Headers to plain object
          : data?.headers), // Use as-is if already a plain object
      });

      let contentType: string | undefined;
      let body: unknown;

      // Handle different data types for request body
      if (data?.json) {
        contentType = "application/json";
        body = JSON.stringify(data.json);
      } else if (data?.form) {
        if (data.form instanceof FormData) {
          // let fetch set Content-Type, with boundary etc.
          body = data.form;
        } else {
          contentType = "application/x-www-form-urlencoded";
          body = stringifySearchParams(data.form as never);
        }
      } else if (data?.raw) {
        // no Content-Type needed
        body = data.raw;
      }

      if (contentType && !headers.get("Content-Type")) {
        headers.set("Content-Type", contentType);
      }

      // Prepare fetch configuration
      const config = {
        ...fetchOpts,
        method,
        headers,
        // Only include body for non-bodyless methods
        ...(bodylessMethods.includes(method) ? {} : { body }),
      };

      const searchParams = data?.query
        ? `?${stringifySearchParams(data.query as never)}`
        : "";

      return transport
        .call(globalThis, url + searchParams, config as never)
        .then((response) => {
          // Return both response and parsed data based on responseMode
          return Promise.all([
            response,
            responseMode === "raw"
              ? response // Return full response object
              : response[responseMode]().catch((e) => e), // Parse response body
          ]);
        })
        .then(([response, data]) => {
          // Create enhanced error object for HTTP errors
          let error = new Error(response.statusText) as HTTPError;

          if (response.ok) {
            if (data instanceof Error) {
              // response parsing failed, rethrow
              error = data as never;
            } else {
              return data;
            }
          }

          error.response = response;
          error.body = data;
          throw error;
        });
    };
  }

  return {
    GET: factory("GET"),
    POST: factory("POST"),
    PUT: factory("PUT"),
    PATCH: factory("PATCH"),
    DELETE: factory("DELETE"),
  };
};
