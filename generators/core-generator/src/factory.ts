import { dirname, resolve } from "node:path";

import { defaults, type ResolvedEntry } from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  createAliasPatterns,
  defineGeneratorFactory,
  generateTsconfig,
  pathResolver,
  renderFactory,
  renderToFile,
  sortRoutes,
} from "@kosmojs/lib";

import * as templates from "./templates";

export default defineGeneratorFactory((sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);
  const { frontend, backend } = sourceFolder.config;

  const seed = async () => {
    const { dependencies = {}, devDependencies = {} } = await import(
      resolve(sourceFolder.root, "package.json"),
      { with: { type: "json" } }
    ).then((m) => m.default);

    // handle tsconfig files
    {
      // deploy a root tsconfig file
      await renderToFile(
        resolve(sourceFolder.root, "tsconfig.json"),
        JSON.stringify(
          {
            extends: `./${defaults.libDir}/tsconfig.json`,
            include: [`./${defaults.libDir}/*.d.ts`],
          },
          undefined,
          2,
        ),
        {},
        { overwrite: false },
      );

      // deploy a tsconfig file for root tsconfig to extend from
      await renderToFile(
        createPath.lib("../tsconfig.json"),
        JSON.stringify(
          generateTsconfig({ dependencies, devDependencies }),
          undefined,
          2,
        ),
        {},
      );

      // deploy a sourceFolder tsconfig file
      await renderToFile(
        createPath.src("tsconfig.json"),
        JSON.stringify(
          {
            extends: `../../${defaults.libDir}/${sourceFolder.name}/tsconfig.json`,
          },
          undefined,
          2,
        ),
        {},
        { overwrite: false },
      );

      // deploy a tsconfig file for sourceFolder tsconfig to extend from

      const tsconfig = generateTsconfig(
        { dependencies, devDependencies },
        sourceFolder.name,
      );

      const compilerOptions: {
        jsx?: string;
        jsxImportSource?: string;
      } = {};

      const types = new Set<string>(tsconfig.compilerOptions.types || []);

      for (const { meta } of sourceFolder.generators) {
        if (meta.jsx) {
          compilerOptions.jsx = meta.jsx;
        }
        if (meta.jsxImportSource) {
          compilerOptions.jsxImportSource = meta.jsxImportSource;
        }
        for (const type of meta.types || []) {
          types.add(type);
        }
      }

      await renderToFile(
        createPath.lib("tsconfig.json"),
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

    // deploy .d.ts files
    for (const [file, template] of [
      ["env.d.ts", templates.libEnvD],
      ["global.d.ts", templates.libGlobalD],
    ]) {
      await renderToFile(createPath.lib(`../${file}`), template, {});
    }

    /**
     * deploy a default gitignore file that ignore everything,
     * except cache.json files; if file exists, do not override.
     * */
    await renderToFile(
      createPath.lib("../.gitignore"),
      templates.libGitignore,
      {},
      { overwrite: false },
    );

    if (sourceFolder.config.frontend) {
      // deploy default index.html file; generators may override as needed
      await renderToFile(
        createPath.src("index.html"),
        templates.srcIndex,
        { entryDir: defaults.entryDir },
        { overwrite: (c) => !c?.trim() /** overwrite only if empty */ },
      );
    }

    if (sourceFolder.config.sidecar) {
      // seed sidecar files
      await renderToFile(
        createPath.lib("sidecar.ts"),
        templates.libSidecar,
        {},
      );

      for (const [file, template] of [
        ["entry.ts", templates.srcSidecarEntry],
        ["run.ts", templates.srcSidecarRun],
      ]) {
        await renderFactory({
          helpers: createImportHelpers({ origin: "src" }),
        }).renderToFile(
          createPath.src(file),
          template,
          {},
          { overwrite: false },
        );
      }
    }
  };

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { renderToFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...routeRenderHelpers(),
      },
      partials: {
        routeMapperPartial: templates.libCoreRouteMapperPartial,
      },
    });

    const apiRoutes = entries
      .flatMap(({ kind, entry }) => {
        return kind === "apiRoute" ? [entry] : [];
      })
      .sort(sortRoutes);

    const pageRoutes = entries
      .flatMap(({ kind, entry }) => {
        return kind === "pageRoute" ? [entry] : [];
      })
      .sort(sortRoutes);

    await renderToFile(
      createPath.libCore("routes.ts"),
      templates.libCoreRouteMapper,
      { apiRoutes, pageRoutes },
    );

    for (const [file, template] of [
      ["config.ts", templates.libCoreConfig],
      ["types.ts", templates.libCoreTypes],
      ["ssr.ts", templates.libCoreSSR],
      ["index.ts", templates.libCoreIndex],
    ]) {
      await renderToFile(createPath.libCore(file), template, {
        base: frontend?.base ? JSON.stringify(frontend.base) : "undefined",
        backendBase: backend?.base ? JSON.stringify(backend.base) : "undefined",
        backendAliasPatterns: JSON.stringify(
          createAliasPatterns(backend?.alias),
        ),
        apiRoutes,
        pageRoutes,
      });
    }

    for (const { kind, entry } of entries) {
      if (kind === "apiRoute") {
        // Generating stub schemas file.
        // It is required by various generators, e.g. api-generator, fetch-generator.
        // Specialized generators (e.g. typebox-generator) may override this later.
        await renderToFile(
          createPath.libApi(dirname(entry.file), "schemas.ts"),
          templates.libSchemas,
          { route: entry },
          { overwrite: false },
        );
      }
    }
  };

  return {
    seed,
    watch: generateLibFiles,
    build: generateLibFiles,
    virtualModules() {
      const { createImport } = pathResolver(sourceFolder);
      return [
        {
          specifier: "virtual:kosmo/backend-app",
          csr: "export default undefined;",
          ssr: sourceFolder.config.backend
            ? `export { default } from "${createImport.api(["app"], { origin: "lib" })}";`
            : "export default undefined;",
        },
      ];
    },
  };
});
