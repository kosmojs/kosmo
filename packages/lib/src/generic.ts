import { readFile } from "node:fs/promises";
import { basename, posix } from "node:path";

import picomatch, { type Matcher } from "picomatch";
import { glob } from "tinyglobby";
import { mergeConfig, type UserConfig } from "vite";

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PREVIEW_HOST,
  DEFAULT_PREVIEW_PORT,
  defaults,
  type KosmoSettings,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";

import { pathResolver } from "./paths";

export const mergeConfigs = (
  ...configs: Array<UserConfig | undefined>
): UserConfig => {
  return [{ configFile: false }, ...configs].reduce<UserConfig>(
    (config, prev) => mergeConfig(config || {}, prev || {}),
    {},
  );
};

export const containsPathTraversalPatterns = (str: string): boolean => {
  return [
    // path traversal patterns
    /\.\.\//,
    /\/\.\//,
  ].some((e) => e.test(str));
};

export const configFilePattern = (folder: string) => {
  return posix.join(defaults.srcDir, folder, "kosmo.config.ts");
};

export const resolveHostAddress = (
  settings: KosmoSettings | undefined,
  key: "devHost" | "previewHost",
) => {
  let [host, port] =
    key === "devHost"
      ? [DEFAULT_HOST, DEFAULT_PORT]
      : [DEFAULT_PREVIEW_HOST, DEFAULT_PREVIEW_PORT];
  if (settings?.[key]) {
    const url = new URL(`http://${settings[key]}`);
    if (url.hostname) {
      host = url.hostname;
    }
    if (url.port) {
      port = Number(url.port);
    }
  }
  return [host, port].join(":");
};

// Route names contain literal [param] / {param} segments, which picomatch would
// otherwise read as character classes / brace expansion.
// Escape them so only * and ** act as wildcards; route paths are matched raw.
export const escapeRouteLiterals = (pattern: string) => {
  return pattern.replace(/[[\]{}]/g, "\\$&");
};

export const createRouteResolver = <T>(
  patterns: Record<string, T> | undefined,
  defaultValue: T,
) => {
  const resolvers: Array<[Matcher, T]> = Object.entries({ ...patterns }).map(
    ([pattern, value]) => [
      picomatch(escapeRouteLiterals(pattern), { dot: true }),
      value as T,
    ],
  );
  return (route: string): T => {
    const match = resolvers.find(([isMatch]) => isMatch(route));
    return match //
      ? match[1]
      : defaultValue;
  };
};

export const createTemplateResolver = (
  projectSettings: ProjectSettings,
  sourceFolder: SourceFolder,
  scope: "backend" | "frontend",
) => {
  const ext = ".tpl";

  const resolver = createRouteResolver<string | undefined>(
    sourceFolder.config[scope]?.templates,
    undefined,
  );

  const { createPath } = pathResolver(projectSettings, sourceFolder);

  return async (pattern: string) => {
    const map: Partial<
      //
      Record<"index" | "use" | "page" | "layout", string>
    > = {};

    const path = resolver(pattern);

    if (!path) {
      return map;
    }

    const files = await glob(
      [
        "index",
        ...(scope === "backend" ? ["use"] : []),
        ...(scope === "frontend" ? ["page", "layout"] : []),
      ].map((file) => file + ext),
      {
        cwd: createPath.src(path),
        absolute: true,
        onlyFiles: true,
        deep: 2,
      },
    );

    for (const file of files) {
      map[basename(file, ext) as keyof typeof map] = await readFile(
        file,
        "utf8",
      );
    }

    return map;
  };
};
