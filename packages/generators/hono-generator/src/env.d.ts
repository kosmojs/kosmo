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
  import type {
    ExtendContext,
    HandlerDefinition,
    MiddlewareDefinition,
    RouteDefinitionItem,
    UseOptions,
    ValidationDefmap,
    ValidationOptmap,
  } from "@kosmojs/api";

  export interface DefaultVariables {}
  export interface DefaultBindings {}

  export type ParameterizedContext<
    ParamsT,
    VariablesT,
    BindingsT,
    VDefs extends ValidationDefmap = {},
    VOpts extends ValidationOptmap = {},
  > = Context<{
    Bindings: DefaultBindings & BindingsT;
    Variables: DefaultVariables & VariablesT;
  }> &
    ExtendContext<ParamsT, VDefs, VOpts, {}>;

  export type ParameterizedMiddleware<
    ParamsT = Record<string, string>,
    VariablesT = Record<string, unknown>,
    BindingsT = Record<string, unknown>,
  > = (
    ctx: ParameterizedContext<ParamsT, VariablesT, BindingsT>,
    next: Next,
  ) => Promise<unknown> | unknown;

  export type Use = <
    VariablesT = DefaultVariables,
    BindingsT = DefaultBindings,
  >(
    middleware:
      | ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
      | Array<
          ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
        >,
    options?: UseOptions,
  ) => MiddlewareDefinition<
    ParameterizedMiddleware<Record<string, string>, VariablesT, BindingsT>
  >;

  export type RouteHandler<
    ParamsT,
    VariablesT,
    BindingsT,
    VDefs extends ValidationDefmap,
    VOpts extends ValidationOptmap = {},
  > = (
    ctx: ParameterizedContext<ParamsT, VariablesT, BindingsT, VDefs, VOpts>,
    next: Next,
  ) => Promise<unknown> | unknown;

  export type DefineRouteFactory<ParamsT, VariablesT, BindingsT> = (
    a: {
      [M in HTTPMethod]: <
        VDefs extends ValidationDefmap,
        VOpts extends ValidationOptmap = {},
      >(
        handler:
          | RouteHandler<ParamsT, VariablesT, BindingsT, VDefs, VOpts>
          | Array<RouteHandler<ParamsT, VariablesT, BindingsT, VDefs, VOpts>>,
      ) => HandlerDefinition<
        ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>
      >;
    },
  ) => Array<
    RouteDefinitionItem<ParameterizedMiddleware<ParamsT, VariablesT, BindingsT>>
  >;

  export const defineRoute: <
    R extends string,
    ParamsD extends [] = [],
    VariablesT extends object = object,
    BindingsT extends object = object,
  >(
    factory: DefineRouteFactory<{}, VariablesT, BindingsT>,
  ) => Array<
    RouteDefinitionItem<ParameterizedMiddleware<{}, VariablesT, BindingsT>>
  >;

  export const use: Use;
}

declare module "{{ createImport 'lib' 'api-factory' }}" {
  import type { Server } from "node:http";
  import type { Hono } from "hono";

  import type {
    RouterFactory,
    Route,
    AppFactory,
    DevSetup,
    ServerFactory,
  } from "@kosmojs/api";

  type ErrorHandler = (
    // biome-ignore lint: any
    error: any,
    ctx: ParameterizedContext<never, {}, {}>,
  ) => Promise<Response> | Response;
  export type ErrorHandlerFactory = (handler: ErrorHandler) => ErrorHandler;
  export const errorHandlerFactory: ErrorHandlerFactory;

  export const devSetup: (setup: DevSetup) => DevSetup;

  type AppEnv = { Variables: DefaultVariables; Bindings: DefaultBindings };
  export type App = Hono<AppEnv>;
  export type AppOptions = ConstructorParameters<typeof Hono<AppEnv>>[0];
  export const appFactory: AppFactory<App, AppOptions>;

  export const routerFactory: RouterFactory<never, never>;
  export const routes: Array<Route> = [];

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
