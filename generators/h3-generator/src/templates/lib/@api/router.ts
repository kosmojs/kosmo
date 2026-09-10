import { command } from "virtual:kosmo/env";
import type { Middleware } from "h3";

import { createRoutes } from "@kosmojs/core/api";

import type { ParameterizedMiddleware } from "../api";
import { createBodyparsers, createMetaparsers } from "./parsers";
import { routeSources } from "./routes";

import globalMiddleware from "{{ createImport 'api' 'use' }}";

export const routes = createRoutes<ParameterizedMiddleware, Middleware>(
  routeSources,
  {
    productionBuild: command === "build",
    responseResolver(event, body) {
      /**
       * H3 builds the actual Response AFTER the middleware chain completes,
       * so at this point event.res only reflects what handlers set explicitly.
       * Reconstruct what will be sent instead: a returned Response is authoritative;
       * otherwise an unset status means 200, and the content type follows H3's
       * serialization rules for the returned value (string -> text, object -> JSON).
       * */
      const rawResponse = body instanceof Response ? body : undefined;

      return {
        status: rawResponse?.status ?? event.res.status ?? 200,
        contentType:
          rawResponse?.headers.get("Content-Type") ??
          event.res.headers.get("Content-Type") ??
          (typeof body === "string"
            ? "text/plain"
            : body === undefined || body === null
              ? null
              : "application/json"),
        async body() {
          return rawResponse
            ? await rawResponse
                .clone()
                .json()
                .catch(() => undefined)
            : body;
        },
      };
    },
    createBodyparsers,
    createMetaparsers,
    globalMiddleware: globalMiddleware as never,
  },
);
