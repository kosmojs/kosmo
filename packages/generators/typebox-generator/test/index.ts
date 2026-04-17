import { resolve } from "node:path";

import type {
  SourceFolder,
  ValidationSchema,
  ValidationSchemas,
  ValidationTarget,
} from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import coreGenerator from "@kosmojs/core-generator";
import typeboxGenerator from "@kosmojs/typebox-generator";

export { MESSAGE_CODES } from "@kosmojs/typebox-generator";

export const appRoot = resolve(import.meta.dirname, "@fixtures/app");

import type { RouteName } from "./@fixtures/routes";

export { defineRoute } from "@kosmojs/koa-generator/lib";

export const sourceFolder: SourceFolder = {
  name: "test",
  config: {
    generators: [coreGenerator(), typeboxGenerator()],
  },
  root: appRoot,
  baseurl: "",
  apiurl: "",
  distDir: "dist",
};

export const importSchema = async (
  route: RouteName,
  schemaPath: "params" | `${ValidationTarget}.${"GET" | "POST"}`,
) => {
  const { createPath } = pathResolver(sourceFolder);

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
    return schemas.validationSchemas.response?.[method][0];
  }

  return (
    schemas.validationSchemas[target] as Record<string, ValidationSchema>
  )?.[method];
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
