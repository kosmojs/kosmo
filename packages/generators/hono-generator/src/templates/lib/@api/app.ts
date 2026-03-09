import { Hono } from "hono";

import type { AppFactory } from "@kosmojs/api";

import type {
  DefaultBindings,
  DefaultVariables,
} from "{{ createImport 'libApi' }}";

export type AppEnv = {
  Variables: DefaultVariables;
  Bindings: DefaultBindings;
};

export type App = Hono<AppEnv>;

export type AppOptions = ConstructorParameters<typeof Hono<AppEnv>>[0];

export const appFactory: AppFactory<App, AppOptions> = (factory) => {
  const createApp = (options?: AppOptions) => {
    return new Hono({ strict: false, ...options });
  };
  return factory({ createApp });
};
