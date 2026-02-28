import { resolve } from "node:path";

import type {
  HTTPMethod,
  RequestValidationTarget,
  RouteDefinitionItem,
} from "@kosmojs/api";
import { type PluginOptionsResolved, pathResolver } from "@kosmojs/dev";
import type { Options } from "@kosmojs/fetch";

import {
  type DefineRouteFactory,
  defineRouteFactory,
  type ParameterizedMiddleware,
} from "@kosmojs/koa-generator";
import typeboxGenerator from "@kosmojs/typebox-generator";

import type { RouteName } from "./@fixtures//routes";

import fetchGenerator from "@src/index";

export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

export const resolvedOptions: PluginOptionsResolved = {
  generators: [fetchGenerator(), typeboxGenerator()],
  refineTypeName: "TRefine",
  watcher: { delay: 0 },
  baseurl: "",
  apiurl: "",
  appRoot,
  sourceFolder: "test",
  outDir: "_dist",
  command: "build",
};

export type ResponseT = {
  url: string;
  method: HTTPMethod;
  headers: Record<string, unknown>;
  params: Record<string, unknown>;
  searchParams: Record<string, unknown>;
  json?: Record<string, unknown>;
  form?: Record<string, unknown>;
  raw?: unknown;
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

export const importFetchClient = async (route: RouteName) => {
  const { createPath } = pathResolver(resolvedOptions);

  const fetchClient: Record<
    HTTPMethod,
    (
      params: [...a: Array<string | number>],
      payload?: Partial<Record<RequestValidationTarget, unknown>>,
      options?: Options,
    ) => Promise<ResponseT>
  > = await import(createPath.fetch(route, `index.ts?${Date.now()}`)).then(
    (e) => e.default,
  );

  return fetchClient;
};

export const typedEntries = <T extends Readonly<Record<string, unknown>>>(
  obj: T,
) => Object.entries(obj) as Array<[keyof T, T[keyof T]]>;

export const serializeFormData = async (formData: FormData) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = await value.arrayBuffer();
      result[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
        content: Buffer.from(buffer).toString("base64"),
      };
    } else {
      result[key] = value;
    }
  }
  return result;
};
