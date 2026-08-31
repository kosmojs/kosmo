import { dirname, resolve } from "node:path";
import { styleText } from "node:util";

import semver from "semver";

import { defaults, type ResolvedEntry } from "@kosmojs/core";
import { routeRenderHelpers } from "@kosmojs/core/generators";
import {
  defineGeneratorFactory,
  pathResolver,
  renderFactory,
  renderToFile,
} from "@kosmojs/lib";

import * as templates from "./templates";
import { generateTsconfig } from "./tsconfig";

/**
 * Generates stub files required by various generators.
 * Ensures cross-generator dependencies remain resolvable
 * even if specialized generators supposed to generate these files are not installed.
 * */
export default defineGeneratorFactory((sourceFolder) => {
  const { createPath, createImportHelpers } = pathResolver(sourceFolder);
  const { generators } = sourceFolder.config;

  const start = async () => {
    const { dependencies = {}, devDependencies = {} } = await import(
      resolve(sourceFolder.root, "package.json"),
      { with: { type: "json" } }
    ).then((m) => m.default);

    // check dependencies
    {
      const missing: Array<[string, string, string]> = [];
      const outdated: Array<[string, string, string]> = [];

      const required = generators.flatMap((generator) => {
        return (["dependencies", "devDependencies"] as const).flatMap((key) => {
          return generator[key]
            ? Object.entries(
                typeof generator[key] === "function"
                  ? (generator[key] as Function)(generator.options)
                  : (generator[key] as object),
              ).flatMap(([name, v]) => {
                const minVersion = semver.minVersion(v as string)?.version;
                return minVersion ? [[name, minVersion, key]] : [];
              })
            : [];
        });
      });

      for (const [name, minVersion, key] of required) {
        const rawVersion = dependencies[name] || devDependencies[name];
        const version = rawVersion
          ? semver.minVersion(rawVersion)?.version
          : undefined;
        if (!rawVersion || !version) {
          missing.push([name, minVersion, key]);
        } else {
          if (semver.lt(version, minVersion)) {
            outdated.push([name, minVersion, key]);
          }
        }
      }

      if (missing.length) {
        console.error(
          styleText(
            ["red", "italic"],
            `There are ${missing.length} missing dependencies, please consider installing them.`,
          ),
        );
        for (const key of ["dependencies", "devDependencies"]) {
          const deps = missing.filter((e) => e[2] === key);
          if (deps.length) {
            console.error(
              `${key}: ${styleText(["blue"], deps.map(([name]) => name).join(" "))}`,
            );
          }
        }
      }

      if (outdated.length) {
        console.error(
          styleText(
            ["yellow", "italic"],
            `There are ${outdated.length} outdated dependencies, please consider updating them:`,
          ),
        );
        console.error(outdated.map(([name]) => name).join(" "));
        console.error();
      }
    }

    // handle tsconfig files
    {
      // deploy a root tsconfig file
      await renderToFile(
        resolve(sourceFolder.root, "tsconfig.json"),
        JSON.stringify(
          { extends: `./${defaults.libDir}/tsconfig.json` },
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

      for (const { meta } of generators) {
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
      ["env.d.ts", templates.envD],
      ["global.d.ts", templates.globalD],
    ]) {
      await renderToFile(createPath.lib(`../${file}`), template, {});
    }

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

    for (const [file, template] of [
      /**
       * deploy a stub SSG file.
       * generators that support SSG will override it as needed.
       * then SSG generator will import it and generate static files for exported routes.
       * */
      ["ssg.ts", "export default [];"],
    ]) {
      await renderToFile(createPath.lib(file), template, {});
    }

    if (generators.some((e) => e.meta.slot === "frontend")) {
      // deploy default index.html file; generators may override as needed
      await renderToFile(
        createPath.src("index.html"),
        templates.index,
        { entryDir: defaults.entryDir },
        { overwrite: (c) => !c?.trim() /** overwrite only if empty */ },
      );
    }
  };

  const generateLibFiles = async (entries: Array<ResolvedEntry>) => {
    const { renderToFile } = renderFactory({
      helpers: {
        ...createImportHelpers({ origin: "lib" }),
        ...routeRenderHelpers(),
      },
      partials: {
        routeMapperPartial: templates.coreRouteMapperPartial,
      },
    });

    await renderToFile(
      createPath.libCore("routes.ts"),
      templates.coreRouteMapper,
      {
        apiRoutes: entries.flatMap(({ kind, entry }) => {
          return kind === "apiRoute" ? [entry] : [];
        }),
        pageRoutes: entries.flatMap(({ kind, entry }) => {
          return kind === "pageRoute" ? [entry] : [];
        }),
      },
    );

    for (const [file, template] of [
      ["config.ts", templates.coreConfig],
      ["types.ts", templates.coreTypes],
      ["ssr.ts", templates.coreSSR],
      ["index.ts", templates.coreIndex],
    ]) {
      await renderToFile(createPath.libCore(file), template, sourceFolder);
    }

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
    start,
    watch: generateLibFiles,
    build: generateLibFiles,
    virtualModules() {
      const backendGenerator = generators.some(
        (e) => e.meta.slot === "backend",
      );
      return [
        {
          specifier: "virtual:kosmo/backend-app",
          csr: "export default undefined;",
          ssr: backendGenerator
            ? `export { default } from "${createPath.api("app")}";`
            : "export default undefined;",
        },
      ];
    },
  };
});
