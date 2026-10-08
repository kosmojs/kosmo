import type { HTTPMethod } from "@kosmojs/core/fetch";

import { clearHeaders, setHeaders, withHeaders } from "./backend-context";

import type { ResponseT as ResponseO } from "{{ createImport 'lib' 'fetch' }}";
import fetchClients from "{{ createImport 'lib' 'fetch' }}";

export type ResponseT = {
  [R in keyof ResponseO]: {
    [M in keyof ResponseO[R]]: {
      body: ResponseO[R][M] | Error;
      response: Response;
    };
  };
};

type FetchClients = typeof fetchClients;

type BodyFor<
  R extends PropertyKey,
  M extends PropertyKey,
> = R extends keyof ResponseT
  ? M extends keyof ResponseT[R]
    ? ResponseT[R][M]["body"]
    : never
  : never;

// Rewrite a function's return type to Promise<{ body; response }>
type WithDescriptor<F, Body> = F extends (...args: infer A) => unknown
  ? (...args: A) => Promise<{ body: Body; response: Response }>
  : F;

type RemapRoute<R extends keyof FetchClients> = {
  [M in keyof FetchClients[R]]: M extends HTTPMethod
    ? WithDescriptor<FetchClients[R][M], BodyFor<R, M>>
    : FetchClients[R][M];
};

export { clearHeaders, setHeaders, withHeaders };

export const prepareHarness = async <R extends keyof FetchClients>(
  route: R,
) => {
  const clients = { ...fetchClients } as unknown as {
    [R in keyof FetchClients]: RemapRoute<R>;
  };
  return { clients, client: clients[route], route };
};
