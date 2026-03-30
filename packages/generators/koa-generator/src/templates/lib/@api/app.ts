import Koa from "koa";

import type { AppFactory } from "@kosmojs/api";

import type { DefaultContext, DefaultState } from "../api";

export type App = Koa<DefaultState, DefaultContext>;

export type AppOptions = ConstructorParameters<
  typeof Koa<DefaultState, DefaultContext>
>[0];

export const appFactory: AppFactory<App, AppOptions> = (factory) => {
  const createApp = (options?: AppOptions) => {
    return new Koa(options);
  };
  return factory({ createApp });
};
