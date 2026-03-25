declare const KOSMO_PRODUCTION_BUILD: boolean;

declare module "*.hbs" {
  const src: string;
  export default src;
}

declare module "*?as=text" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'libApi' }}" {
  import type { Next } from "koa";
  import type { RouterContext } from "@koa/router";

  import type {
    ExtendContext,
    HandlerDefinition,
    HTTPMethod,
    MiddlewareDefinition,
    RouteDefinitionItem,
    UseOptions,
    ValidationDefmap,
    ValidationOptmap,
  } from "@kosmojs/api";

  export interface DefaultState {}
  export interface DefaultContext {}

  export type ParameterizedContext<
    ParamsT,
    StateT,
    ContextT,
    VDefs extends ValidationDefmap = {},
    VOpts extends ValidationOptmap = {},
  > = RouterContext<
    DefaultState & StateT,
    DefaultContext & ContextT & ExtendContext<ParamsT, VDefs, VOpts, {}>
  >;

  export type RouteHandler<
    ParamsT,
    StateT,
    ContextT,
    VDefs extends ValidationDefmap,
    VOpts extends ValidationOptmap = {},
  > = (
    ctx: ParameterizedContext<ParamsT, StateT, ContextT, VDefs, VOpts>,
    next: Next,
  ) => Promise<void> | void;

  export type ParameterizedMiddleware<
    ParamsT = Record<string, string>,
    StateT = Record<string, unknown>,
    ContextT = Record<string, unknown>,
  > = (
    ctx: ParameterizedContext<ParamsT, StateT, ContextT>,
    next: Next,
  ) => Promise<void> | void;

  export type Use = <StateT = DefaultState, ContextT = DefaultContext>(
    middleware:
      | ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
      | Array<
          ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
        >,
    options?: UseOptions,
  ) => MiddlewareDefinition<
    ParameterizedMiddleware<Record<string, string>, StateT, ContextT>
  >;

  export const use: Use;

  export type DefineRouteFactory<ParamsT, StateT, ContextT> = (
    a: {
      [M in HTTPMethod]: <
        VDefs extends ValidationDefmap,
        VOpts extends ValidationOptmap = {},
      >(
        handler:
          | RouteHandler<ParamsT, StateT, ContextT, VDefs, VOpts>
          | Array<RouteHandler<ParamsT, StateT, ContextT, VDefs, VOpts>>,
      ) => HandlerDefinition<
        ParameterizedMiddleware<ParamsT, StateT, ContextT>
      >;
    },
  ) => Array<
    RouteDefinitionItem<ParameterizedMiddleware<ParamsT, StateT, ContextT>>
  >;

  export const defineRoute: <
    R extends string,
    ParamsD extends [] = [],
    StateT extends object = object,
    ContextT extends object = object,
  >(
    factory: DefineRouteFactory<{}, StateT, ContextT>,
  ) => Array<
    RouteDefinitionItem<ParameterizedMiddleware<{}, StateT, ContextT>>
  >;
}

declare module "{{ createImport 'lib' 'api-factory' }}" {
  import type { Server } from "node:http";

  import type Koa from "koa";
  import type { Router, RouterMiddleware } from "@koa/router";

  import type {
    AppFactory,
    RouterFactory,
    Route,
    DevSetup,
    ServerFactory,
  } from "@kosmojs/api";

  export type ErrorHandlerFactory = <T = RouterMiddleware<StateT, ContextT>>(
    h: T,
  ) => T;
  export const errorHandlerFactory: ErrorHandlerFactory;

  export type App = Koa<DefaultState, DefaultContext>;
  export type AppOptions = ConstructorParameters<
    typeof Koa<DefaultState, DefaultContext>
  >[0];
  export const appFactory: AppFactory<App, AppOptions>;

  export const routerFactory: RouterFactory<Router, never>;
  export const routes: Array<Route> = [];

  export const devSetup: (setup: DevSetup) => DevSetup;

  export const serverFactory: ServerFactory<App, Server>;
}

declare module "{{ createImport 'api' 'use' }}" {
  export default [];
}

declare module "{{ createImport 'lib' '@api/routes' }}" {
  import type { RouteSource } from "@kosmojs/api";
  export type RouteMap = Record<
    string,
    {
      paramsDefaults: Array<unknown>;
      paramsMappings: Array<[string, unknown, boolean]>;
    }
  >;
  export const routeSources: Array<RouteSource> = [];
}
