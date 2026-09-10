import { command } from "virtual:kosmo/env";
import type { MiddlewareHandler } from "hono";

import { createRoutes } from "@kosmojs/core/api";

import type { ParameterizedMiddleware } from "../api";
import { createBodyparsers, createMetaparsers } from "./parsers";
import { routeSources } from "./routes";

import globalMiddleware from "{{ createImport 'api' 'use' }}";

export const routes = createRoutes<ParameterizedMiddleware, MiddlewareHandler>(
  routeSources,
  {
    productionBuild: command === "build",
    createBodyparsers,
    createMetaparsers,
    responseResolver(ctx) {
      return {
        status: ctx.res.status,
        contentType: ctx.res.headers.get("Content-Type"),
        async body() {
          return ctx.res
            .clone()
            .json()
            .catch(() => undefined);
        },
      };
    },
    globalMiddleware: globalMiddleware as never,
  },
);
