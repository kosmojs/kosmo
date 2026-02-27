import { resolve } from "node:path";

import type {
  RouteDefinitionItem,
  ValidationSchema,
  ValidationSchemas,
  ValidationTarget,
} from "@kosmojs/api";
import { type PluginOptionsResolved, pathResolver } from "@kosmojs/dev";

import {
  type DefineRouteFactory,
  defineRouteFactory,
  type ParameterizedMiddleware,
} from "@kosmojs/koa-generator";

import typeboxGenerator from "@src/index";

export { MESSAGE_CODES } from "@src/templates/error-handler";
export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

import type { RouteName } from "./@fixtures/routes";

export const resolvedOptions: PluginOptionsResolved = {
  generators: [typeboxGenerator()],
  refineTypeName: "TRefine",
  watcher: { delay: 0 },
  baseurl: "",
  apiurl: "",
  appRoot,
  sourceFolder: "test",
  outDir: "_dist",
  command: "build",
};

export const importSchema = async (
  route: RouteName,
  schemaPath: "params" | `${ValidationTarget}.${"GET" | "POST"}`,
) => {
  const { createPath } = pathResolver(resolvedOptions);

  const schemas: { validationSchemas: ValidationSchemas } = await import(
    createPath.libApi(route, `schemas.ts?${Date.now()}`)
  );

  if (schemaPath === "params") {
    return schemas.validationSchemas.params;
  }

  const [target, method] = schemaPath.split(".") as [
    ValidationTarget,
    "GET" | "POST",
  ];

  if (target === "response") {
    return schemas.validationSchemas.response?.[method][0]?.schema;
  }

  return (
    schemas.validationSchemas[target] as Record<
      string,
      { schema: ValidationSchema }
    >
  )?.[method]?.schema;
};

/**
 * Generates all possible path combinations from an array of elements
 * @param {Array<string>} elements - Array of path segments
 * @returns {Array<string[]>} Array of all possible path combinations
 * */
export const generatePathCombinations = (
  elements: Array<string>,
): Array<string[]> => {
  if (elements.length === 0) {
    return [[]];
  }

  const results = new Set<string>();

  function permute(arr: string[], current: string[] = []) {
    // Add all subpaths
    current.forEach((_, index) => {
      if (index > 0) {
        // Skip empty array
        const path = JSON.stringify(current.slice(0, index + 1));
        results.add(path);
      }
    });

    // Add the full current path
    if (current.length > 0) {
      results.add(JSON.stringify(current));
    }

    // Iterate through remaining elements
    arr.forEach((element, index) => {
      const remaining = arr.filter((_, i) => i !== index);
      permute(remaining, [...current, element]);
    });
  }

  permute(elements);

  // Convert JSON strings back to arrays and sort by length, then lexicographically
  return Array.from(results)
    .map((json) => JSON.parse(json) as Array<string>)
    .sort((a, b) => {
      return a.length === b.length
        ? a.join("/").localeCompare(b.join("/"))
        : a.length - b.length;
    });
};

type ParamsTuple = Array<unknown>;

type ParamsMapper<_T extends ParamsTuple> = {};

export const defineRoute: <
  ParamsT extends ParamsTuple = [],
  StateT extends object = object,
  ContextT extends object = object,
>(
  factory: DefineRouteFactory<ParamsMapper<ParamsT>, StateT, ContextT>,
) => Array<
  RouteDefinitionItem<
    ParameterizedMiddleware<ParamsMapper<ParamsT>, StateT, ContextT>
  >
> = (factory) => defineRouteFactory(factory);
