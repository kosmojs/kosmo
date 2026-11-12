import { styleText } from "node:util";

import {
  defaults,
  type ProjectSettings,
  type ResolvedTypeSignature,
  type SourceFolder,
} from "@kosmojs/core";

import { pathResolver } from "../paths";
import { discoveryFactory } from "./discovery";
import { closeSchema, resolvedTypeOf, unresolvedRefs } from "./schema";
import {
  extractDefaultExport,
  extractGenerics,
  extractParamsRefinements,
  extractRouteMethods,
  extractTypeDeclarations,
  resolveRouteSignature,
} from "./signature";

export { type ParsedSource, parseSource } from "./parse";
export {
  closeSchema,
  isBooleanSchema,
  isNumericSchema,
  resolvedTypeOf,
  unresolvedRefs,
} from "./schema";
export type { PathResolver, RouteCall } from "./signature";

/**
 * The custom types the typebox runtime supplies; a `$ref` to one is resolved there.
 * */
export const customTypeNames = new Set([
  "Date",
  "File",
  "Blob",
  "Buffer",
  "ArrayBuffer",
]);

export const astFactory = () => {
  /**
   * Discovers and evaluates the validation types of routes.
   *
   * `resolveTypes` takes a route's types file - its type declarations, imports
   * rewritten to project aliases, plus one alias per validation type - and returns
   * every file those types reach, and, when `evaluate` is set, what each type
   * evaluates to.
   * */
  const typeResolverFactory = (
    projectSettings: ProjectSettings,
    sourceFolder: SourceFolder,
    { refineTypeName = defaults.refineTypeName } = {},
  ) => {
    const { createPath } = pathResolver(projectSettings, sourceFolder);

    const { discover } = discoveryFactory({
      refineTypeName,
      alias: {
        [defaults.appPrefix]: [projectSettings.root],
        [defaults.srcPrefix]: [createPath.src()],
        [defaults.libPrefix]: [createPath.lib()],
      },
    });

    const resolveTypes = (
      entry: { file: string; source: string; route: string },
      {
        names,
        closedTypes = [],
        evaluate = true,
      }: {
        names: Array<string>;
        // the types whose objects reject undeclared properties
        closedTypes?: ReadonlyArray<string>;
        // false collects the graph only
        evaluate?: boolean;
      },
    ): {
      resolvedTypes: Array<ResolvedTypeSignature> | undefined;
      referencedFiles: Array<string>;
    } => {
      const { schemas, files, problems } = discover(entry, names);

      for (const problem of problems) {
        console.warn(
          styleText(["bold", "red"], "✗ Failed resolving a validation type"),
        );
        console.warn(`  ${problem}`);
        console.warn(`  Route: ${entry.route}`);
        console.warn();
      }

      // the entry is the generated types file, not a file the route depends on
      const referencedFiles = files.filter((file) => file !== entry.file);

      if (!evaluate) {
        return { resolvedTypes: undefined, referencedFiles };
      }

      const resolvedTypes = names.flatMap((name) => {
        const schema = schemas[name];
        if (!schema) {
          return [];
        }

        const jsonSchema = closedTypes.includes(name)
          ? closeSchema(schema)
          : schema;

        const unresolved = unresolvedRefs(jsonSchema, customTypeNames);

        if (unresolved.length) {
          console.warn(
            styleText(
              ["bold", "red"],
              `✗ ${name} references types that could not be resolved`,
            ),
          );
          console.warn(`  ${unresolved.join(", ")}`);
          console.warn(
            styleText(
              ["cyan"],
              "  Validation fails until they are: define or import them in the route, or in a file it imports",
            ),
          );
          console.warn(`  Route: ${entry.route}`);
          console.warn();
        }

        return [resolvedTypeOf(name, jsonSchema)];
      });

      return { resolvedTypes, referencedFiles };
    };

    return { resolveTypes };
  };

  return {
    extractDefaultExport,
    extractGenerics,
    extractParamsRefinements,
    extractRouteMethods,
    extractTypeDeclarations,
    resolveRouteSignature,
    typeResolverFactory,
  };
};
