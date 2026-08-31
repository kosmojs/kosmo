import { join } from "node:path";
import { styleText } from "node:util";

import {
  DEFAULT_APIBASE,
  type FolderConfig,
  type GeneratorMeta,
  type GeneratorSignature,
  type SourceFolder,
} from "@kosmojs/core";

import coreGenerator from "@kosmojs/core-generator";

export { default as fetchGenerator } from "@kosmojs/fetch-generator";
export { default as h3Generator } from "@kosmojs/h3-generator";
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

export { coreGenerator };

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
    generators: folderGenerators(config),
  };
};

const folderGenerators = (config: FolderConfig): Array<GeneratorSignature> => {
  const generators: Array<GeneratorSignature> = [];

  const generatorsBySlot: Partial<
    Record<NonNullable<GeneratorMeta["slot"]>, GeneratorSignature>
  > = {};

  for (const generator of config.generators || []) {
    if (generator.meta.slot) {
      generatorsBySlot[generator.meta.slot] = generator;
    } else {
      generators.push(generator);
    }
  }

  return [
    // core generator should run first
    coreGenerator(),
    // then backend generator
    ...(generatorsBySlot.backend ? [generatorsBySlot.backend] : []),
    // then fetch generator, only if backend generator also enabled
    ...(generatorsBySlot.fetch && generatorsBySlot.backend
      ? [generatorsBySlot.fetch]
      : []),
    // then frontend generator
    ...(generatorsBySlot.frontend ? [generatorsBySlot.frontend] : []),
    // then slotless generators in the order they were added
    ...generators,
    // ssr generator should run after user generators
    ...(generatorsBySlot.ssr ? [generatorsBySlot.ssr] : []),
    // ssg generator should run after ssr generator
    ...(generatorsBySlot.ssg ? [generatorsBySlot.ssg] : []),
  ];
};
