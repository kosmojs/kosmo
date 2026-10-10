import { basename, dirname, posix } from "node:path";

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
  mergeConfigs,
  pathResolver,
  vitePlugins,
} from "@kosmojs/lib";

export { findFreePortRange, resolveHostAddress } from "@kosmojs/lib";

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

  for (const file of configFiles) {
    const { config, generators } = await jiti.import<
      Pick<SourceFolder, "config" | "generators">
    >(file, { default: true });

    const sourceFolder: SourceFolder = {
      name: basename(dirname(file)),
      config,
      generators,
    };

    const projectSettings: ProjectSettings = {
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

      const [
        path = defaults[scope === "backend" ? "apiDir" : "pagesDir"],
        file = DEFAULT_TEST_FILE,
      ] =
        typeof cfg?.test === "object" && typeof cfg?.test.seed === "object"
          ? [cfg.test.seed.path, cfg.test.seed.name]
          : [undefined, undefined];

      return posix.join(defaults.srcDir, sourceFolder.name, path, "**", file);
    };

    const plugins = [
      vitePlugins.tsconfigPaths(projectSettings, sourceFolder),
      vitePlugins.nodePrefix(),
      vitePlugins.virtualModules(projectSettings, sourceFolder, {
        kind: "ssr",
        command,
      }),
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
            plugins,
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
            plugins,
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
      },
    },
    test: { projects },
  };
};
