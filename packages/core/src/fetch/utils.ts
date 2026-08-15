import type { HostOpt } from "./types";

export const join = (...args: Array<unknown>): string => {
  for (const a of args) {
    if (typeof a === "string" || typeof a === "number") {
      continue;
    }
    throw new Error(
      `The path argument must be of type string or number, received ${typeof a}`,
    );
  }
  return args.join("/").replace(/\/+/g, "/");
};

export const createHost = (host: HostOpt): string => {
  if (typeof host === "string") {
    return host;
  }

  if (typeof host === "object") {
    return [
      host.secure ? "https://" : "http://",
      host.hostname,
      host.port ? `:${host.port}` : "",
    ]
      .join("")
      .replace(/\/+$/, "");
  }

  throw new Error(
    "Expected host to be a string or an object like { hostname: string; port?: number; secure?: boolean }",
  );
};
