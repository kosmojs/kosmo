import { type H3Event, readBody } from "h3";

import {
  parseCookies,
  parseSearchParams,
  type RequestBodyTarget,
  type RequestMetadataParser,
} from "@kosmojs/core";
import { createParamsNormalizers, type RouteSource } from "@kosmojs/core/api";

import type { ParameterizedMiddleware } from "../api";

export const createMetaparsers: (
  r: RouteSource<ParameterizedMiddleware>,
  event: H3Event,
) => Record<RequestMetadataParser, () => unknown> = (routeSource, event) => {
  const {
    //
    normalizeParams,
    normalizeSearchParams,
  } = createParamsNormalizers<ParameterizedMiddleware>(routeSource);

  return {
    method() {
      return event.req.method;
    },

    pathname() {
      return event.url.pathname;
    },

    params() {
      return normalizeParams(event.url.pathname);
    },

    query() {
      return normalizeSearchParams(
        parseSearchParams(event.url ?? ""),
        event.req.method,
      );
    },

    headers() {
      return Object.fromEntries(event.req.headers);
    },

    cookies() {
      return parseCookies(Object.fromEntries(event.req.headers));
    },
  };
};

export const createBodyparsers: (
  r: RouteSource<ParameterizedMiddleware>,
  event: H3Event,
) => Record<RequestBodyTarget, () => Promise<unknown>> = (
  _routeSource,
  event,
) => {
  return {
    json() {
      return event.req.json();
    },

    form() {
      return readBody(event, { type: "formData" });
    },

    raw() {
      return event.req.text();
    },
  };
};
