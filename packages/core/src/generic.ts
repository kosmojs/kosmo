// WARN: keep this file isomorphic! it is loaded from both browser and server.

import type { IncomingMessage } from "node:http";

import { parseCookie } from "cookie";
import { parse, stringify } from "picoquery";


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
