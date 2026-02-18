import { defaults } from "./defaults";
import type {
  FetchMapper,
  FetchMethod,
  HTTPError,
  HTTPMethod,
  Options,
} from "./types";

export * from "./defaults";
export * from "./types";
export * from "./utils";

// HTTP methods that typically don't include a request body
const bodylessMethods = ["GET", "DELETE"];

// Main factory function that creates a configured fetch client instance
export default (base: string | URL, baseOpts?: Options): FetchMapper => {
  // Factory function that creates HTTP method implementations
  function factory(method: HTTPMethod): FetchMethod {
    return async (...args: Partial<Parameters<FetchMethod>>) => {
      const [path, data, opts] = args;

      const {
        responseMode,
        stringify,
        errorHandler,
        ...fetchOpts // Remaining options passed directly to fetch
      } = {
        ...defaults,
        ...baseOpts,
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
        contentType = "application/x-www-form-urlencoded";
        body = stringify(data.form as never);
      } else if (data?.multipart) {
        // let fetch set Content-Type, with boundary etc.
        body = data.multipart;
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
        ? `?${stringify(data.query as never)}`
        : "";

      return fetch(url + searchParams, config as never)
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
          if (response.ok) {
            return data instanceof Error ? undefined : data;
          }
          // Create enhanced error object for HTTP errors
          const error = new Error(
            data?.error || response.statusText,
          ) as HTTPError;
          error.response = response;
          error.body = data;
          if (errorHandler) {
            return errorHandler(error);
          }
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
