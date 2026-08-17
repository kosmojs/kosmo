import { join } from "node:path";
import { styleText } from "node:util";

import {
  DEFAULT_APIBASE,
  type FolderConfig,
  type SourceFolder,
} from "@kosmojs/core";

export { default as coreGenerator } from "@kosmojs/core-generator";
export { default as fetchGenerator } from "@kosmojs/fetch-generator";
export { default as honoGenerator } from "@kosmojs/hono-generator";
export { default as koaGenerator } from "@kosmojs/koa-generator";
export { default as mdxGenerator } from "@kosmojs/mdx-generator";
export { default as openapiGenerator } from "@kosmojs/openapi-generator";
export { default as reactGenerator } from "@kosmojs/react-generator";
export { default as solidGenerator } from "@kosmojs/solid-generator";
export { default as ssgGenerator } from "@kosmojs/ssg-generator";
export { default as ssrGenerator } from "@kosmojs/ssr-generator";
export { default as svelteGenerator } from "@kosmojs/svelte-generator";
export { default as typeboxGenerator } from "@kosmojs/typebox-generator";
export { default as vueGenerator } from "@kosmojs/vue-generator";

export const defineConfig: (config: FolderConfig) => SourceFolder["config"] = (
  config,
) => {
  const env = process.env.NODE_ENV || "development";
  const base = typeof config.base === "string" ? config.base : config.base[env];
  if (!base?.trim()) {
    throw new Error(
      styleText(["red"], "ERROR: Invalid Config - no base provided"),
    );
  }
  return {
    ...config,
    base: join("/", base),
    apiBase: join("/", config.apiBase || DEFAULT_APIBASE),
  };
};
