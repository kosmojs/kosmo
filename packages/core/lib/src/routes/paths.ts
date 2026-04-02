import crc from "crc/crc32";
import { parse, type Token } from "path-to-regexp";

import type {
  PathToken,
  PathTokenParamPart,
  PathTokenStaticPart,
} from "@kosmojs/core";

/**
 * Parse a filesystem route path into structured PathToken array.
 *
 * Uses path-to-regexp v8 AST for parsing, with directory-friendly syntax:
 *   - [param]     => required param - :param
 *   - {param}     => optional param - {:param}
 *   - {...param}  => splat - {*param}
 *
 * Direct :param syntax is prohibited outside {} to avoid ambiguity.
 * Inside {} it is treated as path-to-regexp power syntax and used as-is.
 *
 * Examples:
 *   Required:       [id], [name]
 *   Optional:       {name}, {format}
 *   Splat:          {...path}
 *   Mixed segments: shop/[id]-{name}
 *   Power syntax:   {-v:version{-:pre}}, :name{@:version{.:min}}.js
 * */
export const pathTokensFactory = (
  path: string,
  {
    transformStaticValue = normalizeStaticValue,
  }: {
    transformStaticValue?: (v: string) => string;
  } = {},
): Array<PathToken> => {
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

  const patternTransforms: Array<(s: string) => string> = [
    // Transform required params: [id] => :id
    // Only pure \w param names,
    // [some-id] used as is, not treated as param,
    // use [some_id] instead.
    (s) => s.replace(/\[(\w+)\]/g, ":$1"),

    // Transform optional params: {id} => {:id}
    // Only pure \w param names,
    // anything else treated as a path-to-regexp pattern and used as is.
    // {some-id} treated as an optional static segment.
    // use {some_id} for simple param syntax
    // or {:some-id} pattern where :some is the param name and -id is a static segment.
    (s) => s.replace(/\{(\w+)\}/g, "{:$1}"),

    // Transform splat params: {...param} => {*param}
    (s) => s.replace(/\{\.\.\./g, "{*"),

    // Insert leading slash inside optional/splat groups.
    // {:name} => {/:name}
    // {*name} => {/*name}
    (s) => {
      return s.startsWith("{") // keep this check for intention clarity
        ? s.replace(/^\{/, "{/")
        : s;
    },
  ];

  // detect :param used outside {}
  const detectBareParams = (s: string): ":" | string | undefined => {
    let depth = 0;
    for (const [i, ch] of [...s].entries()) {
      if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
      } else if (ch === ":" && depth === 0) {
        const match = s.slice(i + 1).match(/^\w+/);
        return match?.[0] || ":";
      }
    }
    return;
  };

  const tokens = path
    .replace(/^index\/?/, "")
    .split("/")
    .flatMap<PathToken>((orig) => {
      if (!orig.length) {
        return [];
      }

      const bareParam = detectBareParams(orig);

      if (bareParam === ":") {
        throw new Error(
          `${path} contains colons outside braces, use : only within {}`,
        );
      } else if (bareParam) {
        throw new Error(
          `${path} contains bare params, use [${bareParam}] instead of :${bareParam}`,
        );
      }

      const pattern = patternTransforms.reduce((src, fn) => fn(src), orig);

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
          pattern,
          parts,
        },
      ];
    });

  return tokens;
};

export const createPathPattern = (tokens: Array<PathToken>) => {
  return tokens
    .map(({ pattern }, i) => {
      const next = tokens[i + 1];

      if (!next || next.pattern.includes("/")) {
        return pattern;
      }

      const slashRequired = tokens.slice(i + 1).some((e) => {
        return e.parts.some((e) => {
          return e.type === "static" || e.kind === "required";
        });
      });

      return slashRequired ? `${pattern}/` : pattern;
    })
    .join("");
};

export const createHonoPattern = (tokens: Array<PathToken>) => {
  const staticValue = ({ value }: PathTokenStaticPart) => {
    return normalizeStaticValue(value);
  };

  const paramValue = (p: PathTokenParamPart) => {
    if (p.kind === "splat") {
      return `*`;
    }
    if (p.kind === "optional") {
      return `:${p.name}?`;
    }
    return `:${p.name}`;
  };

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const tokensToRegex = (tokens: Array<Token>): string => {
    return tokens
      .flatMap((t) => {
        if (t.type === "text") {
          return t.value === "/" ? [] : [escapeRegex(t.value)];
        }
        if (t.type === "wildcard") {
          return [".+"];
        }
        if (t.type === "param") {
          return ["[^/]+"];
        }
        if (t.type === "group") {
          return [`(?:${tokensToRegex(t.tokens)})?`];
        }
        return [];
      })
      .join("");
  };

  return tokens
    .flatMap((token, i) => {
      if (token.kind === "static") {
        return [staticValue(token.parts[0] as PathTokenStaticPart)];
      }

      if (token.kind === "param") {
        return [paramValue(token.parts[0] as PathTokenParamPart)];
      }

      // mixed → parse pattern, build regex, emit disposable param
      const { tokens } = parse(token.pattern.replace(/\//g, ""));

      const regex = tokensToRegex(tokens);

      return [`:_${i}{${regex}}`];
    })
    .join("/");
};

export const normalizeStaticValue = (value: string) => {
  return value.replace(/\+/g, "\\\\+");
};
