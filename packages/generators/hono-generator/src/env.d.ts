declare module "*.hbs" {
  const src: string;
  export default src;
}

declare module "*?as=text" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'libApi' }}" {
  import type { MiddlewareHandler } from "hono";
  import type { MiddlewareDefinition, UseOptions } from "@kosmojs/api";
  import type {
    DefaultVariables,
    DefaultBindings,
  } from "./templates/lib/api:app";

  export type Use = <VariablesT = DefaultVariables, indingsT = DefaultBindings>(
    middleware:
      | MiddlewareHandler<VariablesT, indingsT>
      | Array<MiddlewareHandler<VariablesT, indingsT>>,
    options?: UseOptions,
  ) => MiddlewareDefinition<MiddlewareHandler<VariablesT, indingsT>>;

  export const use: Use;
}

declare module "{{ createImport 'api' 'app' }}" {
  import { Hono } from "hono";
  export default new Hono();
}

declare module "{{ createImport 'api' 'router' }}" {
  import { SmartRouter } from "hono/router/smart-router";
  export default new SmartRouter();
}

declare module "{{ createImport 'api' 'use' }}" {
  export default [];
}

declare module "{{ createImport 'lib' 'api' }}" {
  export interface DefaultVariables {}
  export interface DefaultBindings {}
}

declare module "{{ createImport 'lib' 'api:app' }}" {
  import type { AppFactory } from "@kosmojs/api";
  import type { App, AppOptions } from "./templates/lib/api:app";
  export const appFactory: AppFactory<App, AppOptions>;
}

declare module "{{ createImport 'lib' 'api:dev' }}" {
  import type { DevSetup } from "@kosmojs/api";
  export const devSetup: (setup: DevSetup) => DevSetup;
}

declare module "{{ createImport 'lib' 'api:routes' }}" {
  import type { RouteSource } from "@kosmojs/api";
  export const routeSources: Array<RouteSource> = [];
}

declare module "{{ createImport 'lib' 'api:router' }}" {
  import type { RouterFactory, Route } from "@kosmojs/api";
  import type { Router } from "./templates/lib/api:router";
  export const routerFactory: RouterFactory<Router, never>;
  export const routes: Array<Route> = [];
}

declare module "{{ createImport 'lib' 'api:server' }}" {
  import type { Server } from "node:http";
  import type { ServerFactory } from "@kosmojs/api";
  import type { App } from "./templates/lib/api:app";
  export const serverFactory: ServerFactory<App, Server>;
}
