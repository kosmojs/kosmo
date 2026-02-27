import crc from "crc/crc32";
import { parse, type Token } from "path-to-regexp";

import type {
  PathToken,
  PathTokenParamPart,
  PathTokenStaticPart,
  RouteEntry,
} from "../types";

/**
 * Parse a filesystem route path into structured PathToken array.
 *
 * Uses path-to-regexp v8 AST for parsing, with two adaptations:
 *   - {...param} splat notation is transformed to {/*param}
 *   - Leading { in segments gets / restored (stripped by path split)
 *
 * Supports all path-to-regexp v8 patterns including nested optional groups:
 *
 *   Required:  :name, :id, v:version
 *   Optional:  {:name}, {.:format}, {-v:version{-:pre}}
 *   Splat:     {...path}, {...path{.html}}
 *   Mixed:     book-:id, :name{@:version{.:min}}.js
 * */
export const pathTokensFactory = (
  path: string,
  {
    transformStaticValue = normalizeStaticValue,
  }: {
    transformStaticValue?: (v: string) => string;
  } = {},
): [tokens: Array<PathToken>, pattern: string] => {
  /**
   * Recursively extract parts from path-to-regexp AST tokens.
   * A param inside a group is optional; top-level params are required.
   * Wildcard tokens are always splat.
   * Slash-only text nodes (restored for parsing) are skipped.
   * */
  const extractParts = (
    tokens: Array<Token>,
    createConst: (value: string) => string,
    insideGroup = false,
  ): Array<PathTokenStaticPart | PathTokenParamPart> => {
    const parts: Array<PathTokenStaticPart | PathTokenParamPart> = [];

    for (const token of tokens) {
      switch (token.type) {
        case "text":
          // Skip slash-only text nodes (restored it via transformers for parsing)
          if (token.value !== "/") {
            parts.push({
              type: "static",
              value: transformStaticValue(token.value),
            });
          }
          break;
        case "param":
          parts.push({
            type: "param",
            kind: insideGroup ? "optional" : "required",
            name: token.name,
            const: createConst(token.name),
          });
          break;
        case "wildcard":
          parts.push({
            type: "param",
            kind: "splat",
            name: token.name,
            const: createConst(token.name),
          });
          break;
        case "group":
          parts.push(...extractParts(token.tokens, createConst, true));
          break;
      }
    }

    return parts;
  };

  const patternTransormers: Array<(s: string) => string> = [
    // Transform splat params
    // {...param} => {*param}
    // NOTE: should run first
    (src) => src.replace(/\{\.\.\./, "{*"),

    // Restore leading slash inside optional/splat groups.
    // {:name} => {/:name}
    // {*name} => {/*name}
    (src) => {
      return src.startsWith("{") //
        ? src.replace(/^\{/, "{/")
        : src;
    },
  ];

  const tokens = path
    .replace(/^index\/?/, "")
    .split("/")
    .flatMap<PathToken>((orig, i) => {
      if (!orig.length) {
        return [];
      }

      const pattern = patternTransormers.reduce((src, fn) => fn(src), orig);

      const { tokens } = parse(pattern);

      const parts = extractParts(tokens, (val) => {
        // Sanitize param name into a valid JS identifier
        return /\W/.test(val) || /^\d/.test(val)
          ? [val.replace(/^\d+|\W/g, "_"), crc(orig)].join("_")
          : val;
      });

      const isStatic = parts.length === 1 ? parts[0].type === "static" : false;
      const isParam = parts.length === 1 ? parts[0].type === "param" : false;

      const kind: PathToken["kind"] = isStatic
        ? "static"
        : isParam
          ? "param"
          : "mixed";

      return [
        {
          kind,
          orig,
          pattern: pattern.startsWith("{") || i === 0 ? pattern : `/${pattern}`,
          parts,
        },
      ];
    });

  return [tokens, tokens.map((e) => e.pattern).join("")];
};

export const normalizeStaticValue = (value: string) => {
  return value.replace(/\+/g, "\\\\+");
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
  return pathTokens.reduce((a, e) => a + (e.kind === "static" ? 1 : 0), 0);
};
