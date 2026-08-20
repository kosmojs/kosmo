import { type H3Event, readBody } from "h3";

import {
  parseCookies,
  parseSearchParams,
  type RequestBodyTarget,
  type RequestMetadataTarget,
} from "@kosmojs/core";

export const metaparsers: {
  [T in RequestMetadataTarget]: (event: H3Event) => unknown;
} = {
  query(event) {
    return parseSearchParams(event.url);
  },

  headers(event) {
    return Object.fromEntries(event.req.headers);
  },

  cookies(event) {
    return parseCookies(Object.fromEntries(event.req.headers));
  },
};

export const bodyparsers: {
  [T in RequestBodyTarget]: (event: H3Event) => Promise<unknown>;
} = {
  json(event) {
    return event.req.json();
  },

  form(event) {
    return readBody(event, { type: "formData" });
  },

  raw(event) {
    return event.req.text();
  },
};
