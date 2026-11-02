// WARN: keep this file isomorphic! it is loaded from both browser and server.

import type { IncomingMessage } from "node:http";

import { parseCookie } from "cookie";
import { parse, stringify } from "picoquery";

// discard body for these status codes
export const BODYLESS_STATUSES = [101, 103, 204, 205, 304];

export const searchParamsOptions: Partial<import("picoquery").Options> = {
  nestingSyntax: "index",
  arrayRepeat: true,
  arrayRepeatSyntax: "bracket",
};

export const parseCookies = (headers: IncomingMessage["headers"]) => {
  return parseCookie((headers.cookie ?? headers.Cookie ?? "") as never);
};

export const parseSearchParams = (url: string | URL) => {
  return parse(
    new URL(url, "http://localhost").search.slice(1),
    searchParamsOptions,
  );
};

export const stringifySearchParams = (
  searchParams: Record<string, unknown>,
) => {
  return stringify(searchParams, searchParamsOptions);
};

export const maybeNumber = (val: unknown) => {
  if (val === undefined || val === null) {
    return val;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : val;
};

export const maybeBoolean = (val: unknown) => {
  return [true, false, "true", "false"].includes(val as never) //
    ? JSON.parse(val as never)
    : val;
};

export const isJSONContentType = (type: string | undefined) => {
  return type === "application/json" || type?.endsWith("+json");
};

export const join = (...args: Array<unknown>): string => {
  if (args.some((a) => !["string", "number"].includes(typeof a))) {
    console.error(args);
    throw new Error("The path argument must be of type string or number");
  }
  // collapse repeated slashes, keeping a leading "scheme://" intact;
  // drop the separator before optional/splat route groups, they carry their own leading slash: "/{/:id}" -> "{/:id}";
  // drop a trailing slash unless it is the whole path;
  return args
    .join("/")
    .replace(/(^[a-z][a-z\d+.-]*:\/\/)|\/{2,}/gi, (_, scheme) => scheme || "/")
    .replace(/\/(?=\{\/)/g, "")
    .replace(/(?<=[^/])\/$/, "");
};
