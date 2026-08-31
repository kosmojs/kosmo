import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  headers?: HeadersInit;
  tsqClient?: unknown;
  error?: unknown;
};

/**
 * Request-scoped context store.
 * */
export const store = new AsyncLocalStorage<RequestContext>();

/**
 * Origin used to absolutize the relative URLs the client produces.
 * */
export const ssrOrigin = "http://ssr.local";

export const redirectCodes = [
  // Moved Permanently
  301,
  // Found (temporary)
  302,
  // See Other (redirect after POST)
  303,
  // Temporary Redirect (preserves method)
  307,
  // Permanent Redirect (preserves method)
  308,
];
