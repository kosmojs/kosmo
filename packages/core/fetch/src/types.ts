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

export type Options = Partial<Defaults> &
  Pick<
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
  Record<"query" | "json" | "form" | "multipart" | "raw", unknown> & {
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
