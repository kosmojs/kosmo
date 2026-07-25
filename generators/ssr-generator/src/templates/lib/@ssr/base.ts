import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  headers?: HeadersInit;
};

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

/**
 * Origin used to absolutize the relative URLs the client produces.
 * Never resolved over the network; the host part is irrelevant to
 * route matching in both Hono and Koa.
 * */
export const ssrOrigin = "http://ssr.local";

/**
 * Maximum redirect hops, mirroring the fetch spec limit.
 * */
export const maxRedirects = 5;

/**
 * Request-scoped context store.
 * Server-only module - never reaches browser bundles.
 * */
export const store = new AsyncLocalStorage<RequestContext>();
