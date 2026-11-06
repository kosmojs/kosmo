import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseEnv, styleText } from "node:util";

import { glob } from "tinyglobby";

import {
  DEFAULT_ENV_PREFIX,
  defaults,
  type EnvSource,
  type SourceFolder,
} from "@kosmojs/core";

import { expandEnv } from "./dotenv-expand";

/**
 * Read the env files of a source folder, per scope.
 *
 * Lookup dirs: the project root then the source folder, or the scope's `envDir`
 * (relative to the source folder) when set; `envDir: false` skips the scope.
 *
 * As in Vite, all files of a scope are merged first, later files winning,
 * then expanded once, so a reference may point at a key from another file.
 * Keys already set in `process.env` are left out - the real environment wins.
 *
 * - frontend: only keys matching `envPrefix` (`VITE_` by default) are kept,
 * since these get inlined into the bundle;
 * - backend: every key is kept, unless a prefix given.
 *
 * Nothing is written to `process.env`.
 * */
export const loadEnvFiles = async ({
  root,
  name,
  mode,
  config,
}: {
  root: string;
  name: string;
  mode: string;
  config: SourceFolder["config"];
}): Promise<Array<EnvSource>> => {
  const sourceFolderPath = join(root, defaults.srcDir, name);

  const envSources: Array<EnvSource> = [];

  for (const scope of ["frontend", "backend"] satisfies Array<
    EnvSource["scope"]
  >) {
    const {
      envDir,
      envPrefix = scope === "backend"
        ? "" // by default, no prefix restriction on backend
        : DEFAULT_ENV_PREFIX,
    } = { ...config[scope]?.viteConfig };

    if (envDir === false) {
      continue;
    }

    const prefixes = [envPrefix].flat().filter((e) => typeof e === "string");

    const lookupDirs = envDir
      ? [resolve(sourceFolderPath, envDir)]
      : [root, sourceFolderPath];

    const matches = await glob(
      lookupDirs.map((dir) => join(dir, ".env*")),
      { cwd: root, absolute: true, deep: 2, onlyFiles: true },
    );

    const envFiles = lookupDirs.flatMap((dir) => {
      // files inside source folder takes precedence, regadless mode;
      // so src/<folder>/.env will override vars set in any project root file,
      // even .env.[mode]* files
      return ["", ".local", `.${mode}`, `.${mode}.local`].flatMap((suffix) => {
        const file = join(dir, `.env${suffix}`);
        return matches.includes(file) ? [file] : [];
      });
    });

    const parsedFiles: Array<[string, {}]> = [];

    for (const file of envFiles) {
      try {
        const parsed = parseEnv(await readFile(file, "utf8"));
        parsedFiles.push([file, parsed]);
      } catch (
        // biome-ignore lint: any
        error: any
      ) {
        console.warn(
          styleText(
            "red",
            `✗ Failed reading/parsing ${file.replace(root, ".")} file`,
          ),
        );
        console.error(error.message);
      }
    }

    const merged = expandEnv(
      // merge envs from all files
      Object.assign({}, ...parsedFiles.map(([, p]) => p)),
      // expand into a copy of process.env
      { ...process.env },
    );

    for (const [file, parsed] of parsedFiles) {
      const env = Object.fromEntries(
        Object.keys(parsed).flatMap((key) => {
          if (key in process.env || !prefixes.length) {
            return [];
          }
          return prefixes.some((prefix) => key.startsWith(prefix))
            ? [[key, merged[key]]]
            : [];
        }),
      );

      envSources.push({ scope, file, env });
    }
  }

  return envSources;
};
