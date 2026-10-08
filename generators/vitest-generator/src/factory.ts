import { dirname, resolve } from "node:path";

import {
  type ApiRoute,
  createRouteResolver,
  DEFAULT_TEST_FILE,
  defaults,
  type PageRoute,
  type ResolvedEntry,
} from "@kosmojs/core";
import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  renderToFile,
} from "@kosmojs/lib";

import * as templates from "./templates.ts";

export default defineGeneratorFactory((projectSettings, sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(
    projectSettings,
    sourceFolder,
  );

  const { renderToFile: deployLibFile } = renderFactory({
    helpers: createImportHelpers({ origin: "lib" }),
  });

  const { renderToFile: deploySrcFile } = renderFactory({
    helpers: createImportHelpers({ origin: "src" }),
  });

  const reservedKeys = ["name", "path"];

  const createResolver = (scope: "backend" | "frontend") => {
    const config = sourceFolder.config[scope]?.test;

    const filename =
      typeof config === "boolean"
        ? undefined
        : typeof config?.seed === "object"
          ? config.seed.name
          : undefined;

    const path =
      typeof config === "boolean"
        ? undefined
        : typeof config?.seed === "object"
          ? config.seed.path
          : undefined;

    const resolver = config
      ? typeof config === "boolean"
        ? createRouteResolver({ "**": config }, config)
        : createRouteResolver(
            typeof config?.seed === "object"
              ? Object.fromEntries(
                  Object.entries(config.seed).flatMap(([k, v]) => {
                    return reservedKeys.includes(k) ? [] : [[k, v]];
                  }),
                )
              : config.seed === false
                ? { "**": false }
                : {},
            true,
          )
      : undefined;

    return (
      entry: ApiRoute | PageRoute,
    ): { file: string; template: string } | undefined => {
      const match = resolver ? resolver(entry.name) : undefined;

      if (!match) {
        return undefined;
      }

      const template =
        match === true
          ? scope === "backend"
            ? templates.srcBackendTest
            : templates.srcFrontendTest
          : typeof match === "function"
            ? match(entry as never)
            : match;

      return {
        template,
        file: createPath.src(
          path || "",
          scope === "backend" ? defaults.apiDir : defaults.pagesDir,
          dirname(entry.file),
          filename || DEFAULT_TEST_FILE,
        ),
      };
    };
  };

  const backendResolver = createResolver("backend");
  const frontendResolver = createResolver("frontend");

  // by default, write only into blank files
  const overwrite = (content: string) => content?.trim().length === 0;

  const deployHarness = async () => {
    for (const [file, template] of [
      ["test/api.ts", templates.libApi],
      ["test/pages.ts", templates.libPages],
      ["test/backend-context.ts", templates.libBackendContext],
      ["test/backend-transport.ts", templates.libBackendTransport],
      ["test/frontend-setup.ts", templates.libFrontendSetup],
    ]) {
      await deployLibFile(createPath.lib(file), template, {});
    }
  };

  const seedTestFiles = async (entries: Array<ResolvedEntry>) => {
    for (const { kind, entry } of entries) {
      if (kind === "apiRoute") {
        const assets = backendResolver(entry);

        if (!assets) {
          continue;
        }

        await deploySrcFile(
          assets.file,
          assets.template,
          { route: entry },
          { overwrite },
        );
      } else if (kind === "pageRoute") {
        const assets = frontendResolver(entry);

        if (!assets) {
          continue;
        }

        await deploySrcFile(
          assets.file,
          assets.template,
          { route: entry },
          { overwrite },
        );
      }
    }
  };

  return {
    virtualModules() {
      const { createImport } = pathResolver(projectSettings, sourceFolder);
      return [
        {
          // The transport must differ between the browser and the SSR bundle
          specifier: "virtual:kosmo/fetch-transport",
          // `undefined` on the client, so fetch clients fall back to global fetch
          csr: "export default undefined;",
          // an in-process dispatch into the backend app on the server
          ssr: `export { default } from "${createImport.lib(["test/backend-transport"], { origin: "lib" })}";`,
        },
      ];
    },

    async seed() {
      const { backend, frontend } = sourceFolder.config;
      if (backend?.test || frontend?.test) {
        await deployHarness();
        await renderToFile(
          resolve(projectSettings.root, "vitest.config.ts"),
          templates.rootVitestConfig,
          {},
          { overwrite },
        );
      }
    },

    async watch(entries) {
      await seedTestFiles(entries);
    },

    async build(entries) {
      await seedTestFiles(entries);
    },
  };
});
