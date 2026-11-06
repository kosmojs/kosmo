import { basename, dirname, join, posix } from "node:path";
import { parseArgs } from "node:util";

import { createJiti } from "jiti";
import { glob } from "tinyglobby";
import type {
  TestProjectConfiguration,
  UserWorkspaceConfig,
} from "vitest/config";

import {
  DEFAULT_TEST_FILE,
  defaults,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import {
  configFilePattern,
  loadEnvFiles,
  mergeConfigs,
  pathResolver,
  vitePluginsFactory,
} from "@kosmojs/lib";

export {
  findFreePortRange,
  loadEnvFiles,
  resolveHostAddress,
} from "@kosmojs/lib";

export const loadConfig = async (
  root: string,
): Promise<UserWorkspaceConfig> => {
  const jiti = createJiti(root);

  const configFiles = await glob(configFilePattern("*"), {
    cwd: root,
    absolute: true,
    deep: 2,
  });

  const projects: Array<TestProjectConfiguration> = [];
  const command = "test";

  const { values } = parseArgs({
    options: {
      mode: { type: "string", short: "m" },
    },
    strict: false,
    allowPositionals: true,
  });

  const mode = typeof values.mode === "string" ? values.mode : "test";

  for (const file of configFiles) {
    const { config, generators } = await jiti.import<
      Pick<SourceFolder, "config" | "generators">
    >(file, { default: true });

    const name = basename(dirname(file));

    const envSources = await loadEnvFiles({ root, name, mode, config });

    const sourceFolder: SourceFolder = {
      name,
      config,
      generators,
      envSources,
    };

    const projectSettings: ProjectSettings = {
      mode,
      root,
      sourceFolders: [sourceFolder],
      devHost: "/dev/null",
      previewHost: "/dev/null",
      distDir: "/dev/null",
    };

    const { createPath } = pathResolver(projectSettings, sourceFolder);

    const generator = generators.find((e) => e.meta.slot === "test");

    const includePattern = (scope: "backend" | "frontend") => {
      const cfg = config[scope];

      const dir = defaults[scope === "backend" ? "apiDir" : "pagesDir"];

      const [path = dir, file = DEFAULT_TEST_FILE] =
        typeof cfg?.test === "object" && typeof cfg?.test.seed === "object"
          ? [
              cfg.test.seed.path
                ? posix.join(cfg.test.seed.path, dir)
                : undefined,
              cfg.test.seed.name,
            ]
          : [dir, DEFAULT_TEST_FILE];

      return posix.join(defaults.srcDir, sourceFolder.name, path, "**", file);
    };

    const vitePlugins = vitePluginsFactory(projectSettings, sourceFolder);

    const plugins = [
      vitePlugins.nodePrefix(),
      vitePlugins.tsconfigPaths(),
      vitePlugins.virtualModules({ kind: "ssr", command }),
    ];

    if (config.backend?.test) {
      projects.push(
        mergeConfigs(
          // user-provided backend config - lowest priority
          config.backend?.viteConfig,

          // user-provided test config
          typeof config.backend?.test === "object"
            ? config.backend.test.viteConfig
            : undefined,

          // generator config - higher priority
          generator
            ?.factory(projectSettings, sourceFolder)
            .viteConfig?.({ kind: "backend", command }),

          // main config - highest priority
          {
            mode,
            plugins: [...plugins, vitePlugins.envProvider("backend")],
            resolve: {
              conditions: ["node"],
            },
            test: {
              environment: "node",
              name: `${sourceFolder.name}:api`,
              root,
              include: [includePattern("backend")],
            },
          },
        ),
      );
    }

    if (config.frontend?.test) {
      projects.push(
        mergeConfigs(
          // user-provided frontend config - lowest priority
          config.frontend?.viteConfig,

          // user-provided test config
          typeof config.frontend?.test === "object"
            ? config.frontend.test.viteConfig
            : undefined,

          // generator config - higher priority
          generator
            ?.factory(projectSettings, sourceFolder)
            .viteConfig?.({ kind: "frontend", command }),

          // main config - highest priority
          {
            mode,
            plugins: [...plugins, vitePlugins.envProvider("frontend")],
            resolve: {
              conditions: ["node"],
            },
            test: {
              environment: "node",
              name: `${sourceFolder.name}:pages`,
              root,
              include: [includePattern("frontend")],
              globalSetup: [createPath.lib("test/frontend-setup.ts")],
            },
          },
        ),
      );
    }
  }

  return {
    resolve: {
      alias: {
        [defaults.appPrefix]: root,
        [defaults.libRootPrefix]: join(root, defaults.varDir, defaults.libDir),
      },
    },
    test: { projects },
  };
};
