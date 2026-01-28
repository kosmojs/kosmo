import Koa from "koa";
import {
  type IParseOptions,
  type IStringifyOptions,
  parse,
  stringify,
} from "qs";

import type { AppFactory } from "@kosmojs/api";

import type { DefaultContext, DefaultState } from "./api";

export type App = Koa<DefaultState, DefaultContext>;
export type AppOptions = ConstructorParameters<typeof import("koa")>[0];

export type { AppFactory } from "@kosmojs/api";

export const appFactory: AppFactory<App, AppOptions> = (factory) => {
  const createApp = (options?: AppOptions) => {
    return withQueryparser(new Koa(options));
  };
  return factory({ createApp });
};

export const withQueryparser = <T extends Koa>(
  app: T,
  _parseOptions: IParseOptions = {},
  _stringifyOptions: IStringifyOptions = {},
) => {
  const parseOptions = {
    ignoreQueryPrefix: true,
    parseArrays: true,
    arrayLimit: 100,
    parameterLimit: 100,
    depth: 5,
    ..._parseOptions,
  };

  const stringifyOptions = {
    encodeValuesOnly: true,
    arrayFormat: "brackets",
    ..._stringifyOptions,
  } as const;

  const obj = {
    get query() {
      return parse((this as Koa.Request).querystring || "", parseOptions);
    },
    set query(obj: object) {
      (this as Koa.Request).querystring = stringify(obj, stringifyOptions);
    },
  };

  const entries = Object.getOwnPropertyNames(obj).map((name) => [
    name,
    Object.getOwnPropertyDescriptor(obj, name),
  ]) as [name: string, desc: PropertyDescriptor][];

  for (const [name, desc] of entries) {
    Object.defineProperty(app.request, name, desc);
  }

  return app;
};
