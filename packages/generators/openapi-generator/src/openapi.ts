import crc from "crc/crc32";
import Type from "typebox";

import { type RequestBodyTarget, RequestBodyTargets } from "@kosmojs/api";
import {
  type ApiRoute,
  type PathToken,
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

const requestBodyMap: Record<RequestBodyTarget, string | undefined> = {
  json: "application/json",
  form: "application/x-www-form-urlencoded",
  multipart: "multipart/form-data",
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
   * Path Variation Generator
   *   variations for a/b/c:
   *   [ a/b/c ]
   *   variations for a/b/[c]:
   *   [ a/b/{c} ]
   *   variations for a/b/[[c]]:
   *   [ a/b/{c}, a/b ]
   *   variations for a/[b]/[[c]]:
   *   [ a/{b}/{c}, a/{b} ]
   *   variations for a/[[b]]/[[c]]:
   *   [ a/{b}/{c}, a/{b}, a ]
   * */
  const generatePathVariations = (route: ApiRoute) => {
    return route.pathTokens
      .flatMap((e, i) => {
        const next = route.pathTokens[i + 1];
        return !next || next.param?.isOptional || next.param?.isRest
          ? [generateSinglePath([...route.pathTokens.slice(0, i), e])]
          : [];
      })
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

  const generateSinglePath = (tokens: PathToken[]): string => {
    return tokens
      .flatMap((token, i) => {
        if (token.param) {
          if (token.param.isRest) {
            return [`{${token.param.name}*}`];
          }
          return [`{${token.param.name}}`];
        }
        if (i === 0) {
          return token.base === "index" //
            ? ["/"]
            : ["", token.base];
        }
        return [token.base];
      })
      .join("/")
      .replace(/\n+/g, "")
      .replace(/\+/g, "\\\\+");
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
            >(
              (
                map,
                {
                  target,
                  schema,
                  contentType = requestBodyMap[target as never],
                },
              ) => {
                if (contentType) {
                  map[contentType] = {
                    schema: {
                      $ref: generateComponentPath("schemas", route, schema.id),
                    },
                  };
                }
                return map;
              },
              {},
            ),
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
