import { dirname } from "node:path";

import {
  defineGenerator,
  defineGeneratorFactory,
  type GeneratorMeta,
  pathResolver,
  type ResolvedEntry,
  renderToFile,
} from "@kosmojs/lib";

import envTpl from "./templates/env.d.ts?as=text";
import gitignoreTpl from "./templates/gitignore.hbs";
import schemasTpl from "./templates/schemas.hbs";

const factory = defineGeneratorFactory((meta, sourceFolder) => {
  const { createPath } = pathResolver(sourceFolder);

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    /**
     * expose VRefine as a global type.
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
    meta,
    options: undefined,
    async start() {},
    watch: generateLibFiles,
    build: generateLibFiles,
    plugins() {
      return [];
    },
  };
});

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default defineGenerator(() => {
  const meta: GeneratorMeta = { name: "Core" };
  return {
    meta,
    options: undefined,
    factory: (sourceFolder) => factory(meta, sourceFolder),
  };
});
