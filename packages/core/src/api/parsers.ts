import type { IncomingMessage } from "node:http";

import { parseCookie } from "cookie";
import { parse } from "picoquery";

import { querystringOptions } from "#/generic";

export const parseQuerystring = (url: string) => {
  return parse(
    new URL(url, "http://localhost").search.slice(1),
    querystringOptions,
  );
};

export const parseCookies = (headers: IncomingMessage["headers"]) => {
  return parseCookie((headers.cookie ?? headers.Cookie ?? "") as never);
};
