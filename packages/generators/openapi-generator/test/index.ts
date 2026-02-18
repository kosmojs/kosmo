import { resolve } from "node:path";

import type { RouteDefinitionItem } from "@kosmojs/api";
import type { PluginOptionsResolved } from "@kosmojs/dev";

import {
  type DefineRouteFactory,
  defineRouteFactory,
  type ParameterizedMiddleware,
} from "@kosmojs/koa-generator";

export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

export const openapiOptions = {
  openapi: "3.1.0",
  info: {
    title: "test",
    version: "0.0.0",
  },
  servers: [{ url: "http://localhost:8080" }],
};

export const resolvedOptions: PluginOptionsResolved = {
  generators: [
    // providing a stub generator with options.resolveTypes
    {
      name: "",
      moduleConfig: {},
      moduleImport: "",
      async factory() {
        return { async watch() {}, async build() {} };
      },
      options: { resolveTypes: true },
    },
  ],
  refineTypeName: "TRefine",
  watcher: { delay: 0 },
  baseurl: "",
  apiurl: "",
  appRoot,
  sourceFolder: "test",
  outDir: "_dist",
  command: "build",
};

type ParamsTuple = Array<unknown>;

type ParamsMapper<_T extends ParamsTuple> = {};

export const defineRoute: <
  ParamsT extends ParamsTuple = [],
  StateT extends object = object,
  ContextT extends object = object,
>(
  factory: DefineRouteFactory<ParamsMapper<ParamsT>, StateT, ContextT>,
) => Array<
  RouteDefinitionItem<
    ParameterizedMiddleware<ParamsMapper<ParamsT>, StateT, ContextT>
  >
> = (factory) => defineRouteFactory(factory);
