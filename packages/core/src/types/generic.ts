import type { IncomingMessage, ServerResponse } from "node:http";

import type { ResolvedType } from "tfusion";

export type ResolvedTypeSignature = Omit<ResolvedType, "properties"> & {
  // needed for validation
  typeboxSchema?: string;
  properties?: Array<
    NonNullable<ResolvedType["properties"]>[number] & {
      // needed for openapi
      typeboxSchema?: string;
    }
  >;
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
