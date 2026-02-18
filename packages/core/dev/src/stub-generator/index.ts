import { dirname } from "node:path";

import { pathResolver } from "../paths";
import { renderToFile } from "../render";
import type { GeneratorConstructor, ResolvedEntry } from "../types";

import envTpl from "./templates/env.d.ts?as=text";
import gitignoreTpl from "./templates/gitignore.hbs";
import schemasTpl from "./templates/schemas.hbs";

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default (): GeneratorConstructor => {
  return {
    name: "Stub",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    async factory({ appRoot, sourceFolder }) {
      const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
        const { createPath } = pathResolver({ appRoot, sourceFolder });

        /**
         * expose TRefine as a global type.
         * not supposed to be overriden by generators.
         * */
        await renderToFile(createPath.lib("../env.d.ts"), envTpl, {});

        /**
         * deploy a default gitignore file that ignore everything,
         * except cache.json files; if file exists, do not override.
         * */
        await renderToFile(
          createPath.lib("../.gitignore"),
          gitignoreTpl,
          {},
          { overwrite: false },
        );

        for (const { kind, entry } of entries) {
          if (kind === "apiRoute") {
            // Generating stub schemas file.
            // It is required by various generators, e.g. api-generator, fetch-generator.
            // Specialized generators (e.g. typebox-generator) may override this later.
            await renderToFile(
              createPath.libApi(dirname(entry.file), "schemas.ts"),
              schemasTpl,
              { route: entry },
              { overwrite: false },
            );
          }
        }
      };

      return {
        watch: generateLibFiles,
        build: generateLibFiles,
      };
    },
  };
};
