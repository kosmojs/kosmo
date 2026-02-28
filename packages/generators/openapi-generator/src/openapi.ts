import { join } from "node:path";

import crc from "crc/crc32";
import { parse, type Token } from "path-to-regexp";
import Type from "typebox";

import { type RequestBodyTarget, RequestBodyTargets } from "@kosmojs/api";
import {
  type ApiRoute,
  type PluginOptionsResolved,
  type ResponseValidationDefinition,
  sortRoutes,
  typeboxLiteralText,
} from "@kosmojs/dev";

import type {
  JsonSchema,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIPaths,
  OpenAPIResponse,
} from "./types";

const requestBodyMap: Record<RequestBodyTarget, unknown> = {
  json: "application/json",
  form: ["application/x-www-form-urlencoded", "multipart/form-data"],
  raw: undefined,
};

export default (pluginOptions: PluginOptionsResolved) => {
  const jsonSchemaBuilder = (text: string): JsonSchema => {
    if (["Buffer", "ArrayBuffer", "Blob"].includes(text)) {
      return {
        type: "string",
        format: "binary",
      };
    }
    return Type.Script(
      typeboxLiteralText(text, pluginOptions),
    ) as unknown as JsonSchema;
  };

  // Generate unique component ID
  const generateComponentId = (
    route: ApiRoute,
    typeId: string,
    propName?: string,
  ): string => {
    const suffix = propName
      ? `${typeId}_${propName.replace(/[^\w.-]/g, "_")}${crc(propName)}`
      : typeId;
    return `${route.id}_${suffix}`;
  };

  // Generate unique component Path
  const generateComponentPath = (
    section: "parameters" | "schemas",
    route: ApiRoute,
    typeId: string,
    propName?: string,
  ): string => {
    return [
      "#",
      "components",
      section,
      generateComponentId(route, typeId, propName),
    ].join("/");
  };

  const calculatePathSpecificity = (path: string) => {
    // number of static sections actually
    return path.split("/").reduce((a, e) => a + (e.includes("{") ? 0 : 1), 0);
  };

  /**
   * Generate all valid OpenAPI path variations from a path-to-regexp pattern.
   *
   * Groups (optional segments) create branching points - each group can be
   * included or excluded, producing different path variations.
   *
   * Nested groups enforce dependency chains:
   *   files{/x-{*path{.:ext}}}
   *   → ext only appears when path is present
   *   → path only appears when outer group is present
   *
   * Orphaned variations (group text included but none of its params survived)
   * are pruned at the source during recursion.
   *
   * Examples:
   *
   *   "files{/x-{*path}{.:ext}}"
   *   → files
   *   → files/x-.{ext}       (ext without path - valid, ext is independent)
   *   → files/x-{path}*
   *   → files/x-{path}*.{ext}
   *
   *   "files{/x-{*path{.:ext}}}"
   *   → files
   *   → files/x-{path}*       (ext nested inside path group)
   *   → files/x-{path}*.{ext}
   *
   *   "app/:name{-v:version{-:pre}}"
   *   → app/{name}
   *   → app/{name}-v{version}
   *   → app/{name}-v{version}-{pre}
   * */
  const generatePathVariations = (route: ApiRoute): Array<string> => {
    if (route.name === "index") {
      return ["/"];
    }

    const { tokens } = parse(route.pathPattern);

    type Variation = {
      /** OpenAPI path string */
      path: string;
      /** param names present in this variation */
      params: Array<string>;
    };

    type State = { path: string; params: Array<string> };

    /**
     * Recursively collect all param/wildcard names from a token tree.
     * Used to check whether a group's params survived in a variation.
     * */
    const extractParamNames = (tokens: Array<Token>): Array<string> => {
      return tokens.flatMap((t) => {
        switch (t.type) {
          case "param":
            return [t.name];
          case "wildcard":
            return [t.name];
          case "group":
            return extractParamNames(t.tokens);
          default:
            return [];
        }
      });
    };

    /**
     * Recursively process tokens, building path variations.
     *
     * - text/param/wildcard tokens accumulate into current state
     * - group tokens fork into two branches:
     *     1. Exclude - skip the group entirely, process remaining tokens
     *     2. Include - process group children + remaining tokens
     *   Included variations are filtered to ensure at least one of the
     *   group's params is present (prevents orphaned static text).
     *
     * State is immutable - each branch gets its own copy.
     * Base case: no tokens left → emit current state as a variation.
     * */
    const traverse = (tokens: Array<Token>, state: State): Array<Variation> => {
      if (!tokens.length) {
        return [state];
      }

      const [token, ...rest] = tokens;

      switch (token.type) {
        case "text":
          return traverse(rest, {
            path: `${state.path}${token.value}`,
            params: state.params,
          });

        case "param":
          return traverse(rest, {
            path: `${state.path}{${token.name}}`,
            params: [...state.params, token.name],
          });

        case "wildcard":
          return traverse(rest, {
            path: `${state.path}{${token.name}*}`,
            params: [...state.params, token.name],
          });

        case "group": {
          // Branch 1: exclude this group entirely
          const excluded = traverse(rest, state);

          // Branch 2: include this group's tokens
          const included = traverse([...token.tokens, ...rest], state);

          // Prune orphaned variations - group's static text is present
          // but none of the group's params survived (all nested groups excluded)
          const groupParams = extractParamNames(token.tokens);

          const valid = included.filter((v) => {
            return groupParams.some((p) => v.params.includes(p));
          });

          return [...excluded, ...valid];
        }
      }
    };

    const raw = traverse(tokens, { path: "", params: [] });

    /**
     * Build a map to match original route params by index.
     *
     * Needed to strip phantom paths generated by routes where multiple
     * optional params follow each other, e.g.: search/{:type}/{:page}
     *
     * For this route, the following paths are generated:
     * - search                    ✓ valid
     * - search/{:type}            ✓ valid
     * - search/{:type}/{:page}    ✓ valid
     * - search/{:page}            ✗ phantom path
     *
     * To prune phantom paths, each variation param compared against
     * the original route's param order - every param must match its
     * original positional index.
     *
     * Example: search/{:page} is pruned because the `page` param is at
     * index 0, but paramByIndex[0] is `type`.
     * */
    const paramByIndex = route.params.schema.reduce<Record<number, string>>(
      (map, { name }, i) => {
        map[i] = name;
        return map;
      },
      {},
    );

    return raw
      .reduce<Array<string>>((paths, variant) => {
        const path = join("/", variant.path);
        if (paths.includes(path)) {
          // deduplicate, just in case
          return paths;
        }
        if (variant.params.every((p, i) => p === paramByIndex[i])) {
          paths.push(path);
        }
        return paths;
      }, [])
      .sort(
        /**
         * Sorting paths by sections length in reverse order,
         * so more specific goes first.
         *
         * Specificity is determined by the number of static sections.
         * So, /priority/profile is more specific than /priority/{id}/{page}
         * even though the second route has more sections.
         *
         * WARN: without this sorting, more specific paths
         * may override schemas for less specific ones.
         *
         * Example: Without proper sorting:
         *   /search                 (least specific)
         *   /search/{type}          (medium specific)
         *   /search/{type}/{page}   (most specific)
         *
         * Would cause the more specific /search/{type}/{page} path to OVERRIDE
         * schemas for less specific /search/{type} and /search.
         *
         * Correct order (most specific first):
         *   /search/{type}/{page}
         *   /search/{type}
         *   /search
         *
         * */
        (a, b) => calculatePathSpecificity(b) - calculatePathSpecificity(a),
      );
  };

  // Generate path parameters using component references
  const generatePathParameters = (
    route: ApiRoute,
    openapiPath: string,
  ): Array<OpenAPIParameter> | undefined => {
    const parameters = route.params.resolvedType?.properties?.flatMap(
      ({ name }) => {
        return new RegExp(`\\{${name}\\*?\\}`).test(openapiPath)
          ? [
              {
                $ref: generateComponentPath(
                  "parameters",
                  route,
                  route.params.id,
                  name,
                ),
              },
            ]
          : [];
      },
    );
    return parameters?.length //
      ? parameters
      : undefined;
  };

  // Generate responses
  const generateResponses = (
    route: ApiRoute,
    method: string,
  ): Record<string, OpenAPIResponse> => {
    const responseType = route.validationDefinitions.find((e) => {
      return e.method === method ? e.target === "response" : false;
    }) as ResponseValidationDefinition;

    if (!Array.isArray(responseType?.variants)) {
      return {
        "200": {
          description: "Success - TODO: Add response schema",
          content: {
            "text/plain": {
              schema: {
                type: "string",
              },
            },
          },
        },
      };
    }

    return responseType.variants.reduce<Record<string, OpenAPIResponse>>(
      (map, { id, status, contentType, body }) => {
        const redirect = redirectSchema(
          status,
          // when status is a redirect code, contentType is the destination URI
          contentType,
        );

        if (redirect) {
          map[status] = redirect;
        } else {
          map[status] = {
            description: "Success",
            content: {
              [contentType || "application/json"]: {
                schema: body
                  ? { $ref: generateComponentPath("schemas", route, id) }
                  : { type: "object" },
              },
            },
          };
        }

        return map;
      },
      {},
    );
  };

  // Generate component schemas for a route
  const generateComponentSchemas = (
    route: ApiRoute,
  ): {
    parameters: Record<string, OpenAPIParameter>;
    schemas: Record<string, JsonSchema>;
  } => {
    const {
      //
      parameters,
      schemas,
    }: ReturnType<typeof generateComponentSchemas> = {
      parameters: {},
      schemas: {},
    };

    for (const def of route.validationDefinitions) {
      if (def.target === "response") {
        for (const { id, resolvedType } of def.variants) {
          if (resolvedType) {
            schemas[generateComponentId(route, id)] = jsonSchemaBuilder(
              resolvedType.text,
            );
          }
        }
      } else if (def.target === "query") {
        const { id, resolvedType } = def.schema;
        for (const prop of resolvedType?.properties || []) {
          // generating a schema for every property
          const key = generateComponentId(route, id, prop.name);
          schemas[key] = jsonSchemaBuilder(prop.text);
        }
      } else {
        const { id, resolvedType } = def.schema;
        if (resolvedType) {
          schemas[generateComponentId(route, id)] = jsonSchemaBuilder(
            resolvedType.text,
          );
        }
      }
    }

    if (route.params.resolvedType) {
      for (const { name, text } of route.params.resolvedType.properties || []) {
        parameters[generateComponentId(route, route.params.id, name)] = {
          name,
          in: "path",
          required: true,
          schema: jsonSchemaBuilder(text),
        };
      }
    }

    return { parameters, schemas };
  };

  // Generate paths for a route
  const generateRoutePaths = (route: ApiRoute): OpenAPIPaths => {
    const paths: OpenAPIPaths = {};

    const validationTypes = route.validationDefinitions.flatMap((def) => {
      return def.target === "response"
        ? []
        : def.schema.resolvedType
          ? [def]
          : [];
    });

    for (const path of generatePathVariations(route)) {
      for (const method of route.methods) {
        const operation: OpenAPIOperation = {
          responses: generateResponses(route, method),
        };

        const parameters = generatePathParameters(route, path);

        if (parameters) {
          operation.parameters = parameters;
        }

        const queryType = validationTypes.find((e) => {
          return e.method === method ? e.target === "query" : false;
        });

        if (queryType?.schema) {
          for (const prop of queryType.schema.resolvedType?.properties || []) {
            if (!operation.parameters) {
              operation.parameters = [];
            }
            operation.parameters.push({
              name: prop.name,
              in: "query",
              required: !prop.optional,
              schema: {
                $ref: generateComponentPath(
                  "schemas",
                  route,
                  queryType.schema.id,
                  prop.name,
                ),
              },
            });
          }
        }

        const bodyTypes = validationTypes.filter((e) => {
          return e.method === method
            ? Object.keys(RequestBodyTargets).includes(e.target)
            : false;
        });

        if (bodyTypes.length) {
          operation.requestBody = {
            required: true,
            content: bodyTypes.reduce<
              Record<string, { schema: { $ref: string } }>
            >((map, def) => {
              const { contentType = requestBodyMap[def.target as never] } = def;
              if (contentType) {
                const schema = {
                  $ref: generateComponentPath("schemas", route, def.schema.id),
                };
                for (const variant of [contentType].flat()) {
                  map[variant] = { schema };
                }
              }
              return map;
            }, {}),
          };
        }

        if (!paths[path]) {
          paths[path] = {};
        }

        paths[path][method.toLowerCase()] = operation;
      }
    }

    return paths;
  };

  const generateOpenAPISchema = (routes: ApiRoute[]) => {
    const { components, paths } = routes
      .sort(
        /**
         * Sort routes by path depth (descending) so more specific routes
         * are processed first.
         * */
        sortRoutes,
      )
      .flatMap((route) => {
        /**
         * Drop routes that are subsumed by more specific ones.
         *
         * Given this file structure:
         *
         *   search/
         *     {:type}/
         *       {:page}/
         *         index.ts
         *       index.ts
         *
         * Two routes exist: search/{:type} and search/{:type}/{:page}.
         * The shorter route is already covered by the longer one's
         * generated variations, so including both would produce
         * duplicate/phantom paths in the OpenAPI spec.
         * */
        const subsumed = routes.some((e) => {
          return e.name === route.name ? false : e.name.startsWith(route.name);
        });

        return subsumed ? [] : [route];
      })
      .reduce(
        (acc, route) => {
          const paths = generateRoutePaths(route);
          const { parameters, schemas } = generateComponentSchemas(route);
          return {
            paths: { ...acc.paths, ...paths },
            components: {
              parameters: { ...acc.components.parameters, ...parameters },
              schemas: { ...acc.components.schemas, ...schemas },
            },
          };
        },
        {
          paths: {},
          components: {
            parameters: {},
            schemas: {},
          },
        },
      );

    return {
      paths,
      components,
    };
  };

  return {
    generateComponentId,
    generateComponentPath,
    generatePathVariations,
    generateOpenAPISchema,
  };
};

const redirectSchema = (statusCode: number, url?: string) => {
  const schema = {
    type: "string",
    format: "uri",
    ...(url ? { enum: [url] } : {}),
  };
  return {
    301: {
      description: "Moved Permanently",
      headers: {
        Location: {
          description: "New permanent location",
          schema,
        },
      },
    },
    302: {
      description: "Found",
      headers: {
        Location: {
          description: "Temporary location",
          schema,
        },
      },
    },
    303: {
      description: "See Other",
      headers: {
        Location: {
          description: "Location to GET after POST/PUT/DELETE",
          schema,
        },
      },
    },
    307: {
      description: "Temporary Redirect",
      headers: {
        Location: {
          description: "Temporary location (preserves request method)",
          schema,
        },
      },
    },
    308: {
      description: "Permanent Redirect",
      headers: {
        Location: {
          description: "New permanent location (preserves request method)",
          schema,
        },
      },
    },
  }[statusCode];
};
