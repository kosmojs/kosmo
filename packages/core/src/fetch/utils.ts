import { maybeNumber } from "../generic";
import type { ApiRouteSerialized, ValidationTarget } from "../types";
import type { HostOpt } from "./types";

export const join = (...args: Array<unknown>): string => {
  if (args.some((a) => !["string", "number"].includes(typeof a))) {
    console.error(args);
    throw new Error("The path argument must be of type string or number");
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

export const payloadResolver = <T>(
  payload: Record<ValidationTarget, T> | undefined,
  target: ValidationTarget,
  method: string,
  { numericProperties }: Pick<ApiRouteSerialized, "numericProperties">,
): T | Record<string, unknown> | undefined => {
  const data = payload?.[target];

  if (target === "query") {
    return Object.fromEntries(
      Object.entries({ ...data }).map(([k, v]) => {
        return [
          k,
          numericProperties.query[method]?.includes(k)
            ? Array.isArray(v)
              ? v.map((v) => maybeNumber(v))
              : maybeNumber(v)
            : v,
        ];
      }),
    );
  }

  if (data instanceof FormData) {
    return [...data].reduce<
      Record<string, FormDataEntryValue | Array<FormDataEntryValue>>
    >((map, [key, val]) => {
      if (key in map) {
        map[key] = [map[key]].flat().concat(val);
      } else {
        map[key] = val;
      }
      return map;
    }, {});
  }

  return data;
};
