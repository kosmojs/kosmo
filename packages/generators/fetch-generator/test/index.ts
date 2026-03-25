import { resolve } from "node:path";

import type { HTTPMethod, RequestValidationTarget } from "@kosmojs/api";
import type { Options } from "@kosmojs/fetch";
import { pathResolver, type SourceFolder } from "@kosmojs/lib";

import typeboxGenerator from "@kosmojs/typebox-generator";

import type { RouteName } from "./@fixtures//routes";

import fetchGenerator from "@src/index";

export { defineRoute } from "@kosmojs/koa-generator/lib";

export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

export const sourceFolder: SourceFolder = {
  name: "test",
  config: {
    generators: [fetchGenerator(), typeboxGenerator()],
  },
  root: appRoot,
  baseurl: "",
  apiurl: "",
  distDir: "dist",
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

export const importFetchClient = async (route: RouteName) => {
  const { createPath } = pathResolver(sourceFolder);

  const fetchClient: Record<
    HTTPMethod,
    (
      params: [...a: Array<string | number>],
      payload?: Partial<Record<RequestValidationTarget, unknown>>,
      options?: Options,
    ) => Promise<ResponseT>
  > = await import(createPath.libApi(route, `fetch.ts?${Date.now()}`)).then(
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
