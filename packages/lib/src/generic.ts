import { posix } from "node:path";

import { mergeConfig, type UserConfig } from "vite";

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PREVIEW_HOST,
  DEFAULT_PREVIEW_PORT,
  defaults,
  type KosmoSettings,
} from "@kosmojs/core";

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
