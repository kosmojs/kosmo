import { dirname } from "node:path";

import type { GeneratorMeta, ResolvedEntry } from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  defineGenerator,
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  renderToFile,
} from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import * as templates from "./templates";
import { generateTsconfig } from "./tsconfig";

const factory = defineGeneratorFactory((meta, sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);

  const start = async () => {
    // deploy a tsconfig file for root tsconfig to extend from
    await renderToFile(
      createPath.lib("../tsconfig.base.json"),
      JSON.stringify(generateTsconfig(), undefined, 2),
      {},
    );

    // deploy a tsconfig file for sourceFolder tsconfig to extend from
    {
      const tsconfig = generateTsconfig(sourceFolder.name);

      const compilerOptions: { jsxImportSource?: string | undefined } = {};
      const types = new Set<string>(tsconfig.compilerOptions.types || []);

      for (const { meta } of sourceFolder.config.generators || []) {
        if (meta.jsxImportSource) {
          compilerOptions.jsxImportSource = meta.jsxImportSource;
        }
        for (const type of meta.types || []) {
          types.add(type);
        }
      }

      await renderToFile(
        createPath.lib("tsconfig.base.json"),
        JSON.stringify(
          {
            ...tsconfig,
            compilerOptions: {
              ...tsconfig.compilerOptions,
              ...compilerOptions,
              types: [...types.values()],
            },
          },
          undefined,
          2,
        ),
        {},
      );
    }

    /**
     * expose VRefine as a global type.
     * not supposed to be overriden by generators.
     * */
    await renderToFile(createPath.lib("../env.d.ts"), templates.env, {});

    /**
     * deploy a default gitignore file that ignore everything,
     * except cache.json files; if file exists, do not override.
     * */
    await renderToFile(
      createPath.lib("../.gitignore"),
      templates.gitignore,
      {},
      { overwrite: false },
    );

    /**
     * deploy a stub SSG file.
     * generators that support SSG will override it as needed.
     * then SSG generator will import it and generate static files for exported routes.
     * */
    await renderToFile(createPath.lib("ssg.ts"), "export default [];", {});
  };

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { renderToFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...routeRenderHelpers(),
      },
      partials: {
        pathFactory: templates.corePathFactory,
      },
    });

    await renderToFile(
      createPath.libCore("routeMap.ts"),
      templates.coreRouteMap,
      {
        apiRoutes: entries.flatMap(({ kind, entry }) => {
          return kind === "apiRoute" ? [entry] : [];
        }),
        pageRoutes: entries.flatMap(({ kind, entry }) => {
          return kind === "pageRoute" ? [entry] : [];
        }),
      },
    );

    await renderToFile(createPath.libCore("index.ts"), templates.coreIndex, {});

    for (const { kind, entry } of entries) {
      if (kind === "apiRoute") {
        // Generating stub schemas file.
        // It is required by various generators, e.g. api-generator, fetch-generator.
        // Specialized generators (e.g. typebox-generator) may override this later.
        await renderToFile(
          createPath.libApi(dirname(entry.file), "schemas.ts"),
          templates.schemas,
          { route: entry },
          { overwrite: false },
        );
      }
    }
  };

  return {
    meta,
    options: undefined,
    start,
    watch: generateLibFiles,
    build: generateLibFiles,
  };
});

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default defineGenerator(() => {
  const meta: GeneratorMeta = {
    name: "Core",
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  };
  return {
    meta,
    options: undefined,
    factory: (sourceFolder) => factory(meta, sourceFolder),
  };
});
