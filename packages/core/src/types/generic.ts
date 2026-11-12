import type { IncomingMessage, ServerResponse } from "node:http";

import type { UserConfig } from "vite";

export type DeepPartial<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends object
    ? DeepPartial<NonNullable<T[K]>>
    : T[K];
};

export type ChassisCommand = "serve" | "build" | "preview" | "test";

export type ViteConfig = Omit<
  UserConfig,
  | "root"
  | "base"
  | "cacheDir"
  | "mode"
  | "builder"
  | "future"
  | "legacy"
  | "server"
> & {
  server?: Omit<
    NonNullable<UserConfig["server"]>,
    "host" | "port" | "middlewareMode" | "hmr" | "ws"
  > & {
    hmr?: Omit<NonNullable<UserConfig["server"]>["hmr"], "host" | "port">;
    ws?: Omit<NonNullable<UserConfig["server"]>["ws"], "host" | "port">;
  };
};

/**
 * A JSON Schema object, as TypeBox produces and consumes it.
 * */
export type JsonSchema = Record<string, unknown>;

/**
 * A validation type of a route, evaluated to JSON Schema at build time.
 * */
export type ResolvedTypeSignature = {
  // the type's name in the route's types.ts, e.g. JsonTPOST123
  name: string;
  // what the type evaluates to; a custom type of the runtime
  // (Date, File, Blob, Buffer, ArrayBuffer) stays a `{ $ref: "<name>" }`
  jsonSchema: JsonSchema;
  // the top-level properties of an object type; needed for openapi
  properties?: Array<{
    name: string;
    optional: boolean;
    jsonSchema: JsonSchema;
  }>;
  // needed to coerce numeric params and numeric props in query validation target
  numericProperties?: Array<string>;
  // needed to coerce boolean props in query validation target
  booleanProperties?: Array<string>;
};

/**
 * Anything exposing a web-standard fetch handler:
 * Hono/H3 app or a plain `(request: Request) => Response` function wrapped in an object.
 * Extra parameters (env, executionCtx) are accepted and ignored.
 * */
export type FetchApp = {
  fetch: (
    request: Request,
    ...rest: Array<unknown>
  ) => Response | Promise<Response>;
};

/**
 * Anything exposing callback() returning a node request handler:
 * Koa, and by extension Express-style apps wrapped accordingly.
 * */
export type NodeApp = {
  callback: () => (req: IncomingMessage, res: ServerResponse) => unknown;
};

export type RouterFactoryReturn<
  //
  T,
  E extends object = {},
> = [T] extends [Promise<infer U>]
  ? Promise<{ component: U } & E>
  : { component: T } & E;
