export interface Defaults {
  responseMode: ResponseMode;
  stringify: (d: Record<string, unknown>) => string;
  errorHandler: (e: unknown) => void;
}

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ResponseMode =
  | "json"
  | "text"
  | "blob"
  | "formData"
  | "arrayBuffer"
  | "raw";

export type Options = Partial<Defaults> & { transport?: Transport } & Pick<
    RequestInit,
    | "cache"
    | "credentials"
    | "integrity"
    | "keepalive"
    | "mode"
    | "redirect"
    | "referrer"
    | "referrerPolicy"
    | "signal"
    | "window"
  >;

// Path can be a string, number, or array of these
export type PathEntry = string | number;

export type Data = Partial<
  Record<"query" | "json" | "form" | "raw", unknown> & {
    headers: Headers | Record<string, string>;
  }
>;

export type FetchMethod = {
  // No path, no data
  <T = unknown>(): Promise<T>;

  // Path without data
  <T = unknown>(path: PathEntry | Array<PathEntry>): Promise<T>;

  // Path with data
  <T = unknown>(path: PathEntry | Array<PathEntry>, data: Data): Promise<T>;

  // Path with data and options
  <T = unknown>(
    path: PathEntry | Array<PathEntry>,
    data: Data,
    opts: Options,
  ): Promise<T>;
};

export type FetchMapper = Record<HTTPMethod, FetchMethod>;

export interface HTTPError<T extends object = object> extends Error {
  body: T;
  response: Response;
}

export type HostOpt =
  | string
  | { hostname: string; port?: number; secure?: boolean };

/**
 * Minimal transport contract: the call signature of fetch, without
 * its runtime-specific statics (Bun's typeof fetch, for instance,
 * carries a required preconnect property). The client only ever
 * calls the transport, so the call signature is the whole contract;
 * the global fetch remains assignable to it.
 * */
export type Transport = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;
