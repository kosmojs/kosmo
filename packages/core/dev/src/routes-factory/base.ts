import crc from "crc/crc32";

import type { PathToken, RouteEntry } from "../types";

export const pathTokensFactory = (path: string): Array<PathToken> => {
  const requiredParamRegex = /^\[([^\]]+)\]$/;
  const optionalParamRegex = /^\[\[([^\]]+)\]\]$/;
  const restParamRegex = /^\[\.\.\.([^\]]+)\]$/;

  return path.split("/").map((orig, i) => {
    const [base, ext = ""] = orig.split(/(\.([\w\d-]+)$)/);

    const paramBase = (regex: RegExp) => {
      const name = base.replace(regex, "$1") || base;
      return {
        name,
        const: /\W/.test(name)
          ? [name.replace(/\W/g, "_"), crc(orig)].join("_")
          : name,
      };
    };

    let param: PathToken["param"] | undefined;

    if (base.startsWith("[")) {
      // order is highly important!
      if (restParamRegex.test(base)) {
        param = {
          ...paramBase(restParamRegex),
          isRequired: false,
          isOptional: false,
          isRest: true,
        };
      } else if (optionalParamRegex.test(base)) {
        param = {
          ...paramBase(optionalParamRegex),
          isRequired: false,
          isOptional: true,
          isRest: false,
        };
      } else if (requiredParamRegex.test(base)) {
        param = {
          ...paramBase(requiredParamRegex),
          isRequired: true,
          isOptional: false,
          isRest: false,
        };
      }
    }

    return {
      orig,
      base,
      path: i === 0 ? orig.replace(/^index$/, "/") : orig,
      ext,
      ...(param ? { param } : {}),
    } satisfies PathToken;
  });
};

/**
 * Sort routes so that more specific (static) paths come before dynamic ones.
 *
 * This is important because dynamic segments
 * (e.g., `:id` or `*catchall`) are more general,
 * and can match values that should be routed to more specific static paths.
 *
 * For example, given:
 *   - `/users/account`
 *   - `/users/:id`
 *
 * If `/users/:id` comes first, visiting `/users/account` would incorrectly match it,
 * treating "account" as an `id`. So static routes must take precedence.
 * */
export const sortRoutes = (
  a: Pick<RouteEntry, "name" | "pathTokens">,
  b: Pick<RouteEntry, "name" | "pathTokens">,
) => {
  const aStaticSegments = staticSegments(a.pathTokens);
  const bStaticSegments = staticSegments(b.pathTokens);

  // First: compare static segments (more static = higher priority)
  if (aStaticSegments !== bStaticSegments) {
    return bStaticSegments - aStaticSegments;
  }

  // Second: compare depth (shallower = higher priority)
  if (a.pathTokens.length !== b.pathTokens.length) {
    return a.pathTokens.length - b.pathTokens.length;
  }

  // Third: alphabetical for consistency
  return a.name.localeCompare(b.name);
};

const staticSegments = (pathTokens: Array<PathToken>) => {
  return pathTokens.reduce((a, e) => a + (e.param ? 0 : 1), 0);
};
