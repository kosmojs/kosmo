import { posix } from "node:path";

import { mergeConfig, type UserConfig } from "vite";

import { defaults } from "@kosmojs/core";

export const mergeConfigs = (
  ...configs: Array<UserConfig | undefined>
): UserConfig => {
  return [{ configFile: false }, ...configs].reduce<UserConfig>(
    (config, prev) => mergeConfig(config || {}, prev || {}),
    {},
  );
};

export const escapeTemplateLiterals = (origin: string) => {
  return [
    // Escape backticks for safe use in template literals
    [/(?<!\\)`/g, "\\`"],
    // Escape $ for safe use in template literals
    [/(?<!\\)\$\{/g, "\\${"],
  ].reduce((text, [a, b]) => text.replace(a, b as never), origin);
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
