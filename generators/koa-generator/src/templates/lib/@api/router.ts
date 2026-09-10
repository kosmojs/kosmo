import { command } from "virtual:kosmo/env";
import type { RouterMiddleware } from "@koa/router";

import { createRoutes } from "@kosmojs/core/api";

import type { ParameterizedMiddleware } from "../api";
import { createBodyparsers, createMetaparsers } from "./parsers";
import { routeSources } from "./routes";

import globalMiddleware from "{{ createImport 'api' 'use' }}";

export const routes = createRoutes<ParameterizedMiddleware, RouterMiddleware>(
  routeSources,
  {
    productionBuild: command === "build",
    responseResolver(ctx) {
      return {
        status: ctx.status,
        contentType: ctx.type,
        async body() {
          return ctx.body;
        },
      };
    },
    createBodyparsers,
    createMetaparsers,
    globalMiddleware: globalMiddleware as never,
  },
);
