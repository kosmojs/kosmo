import type { GeneratorBase, GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

/**
 * Same reason as in ./factory: the explicit annotation stops declaration emit
 * from expanding `Options` into vite-plugin-svelte's non-exported
 * `PluginOptionsInline` (TS4082). Keep it.
 * */
const generator: (options?: Options[0]) => GeneratorBase =
  defineGenerator<Options>((options) => {
    const meta: GeneratorMeta = {
      name: "Svelte",
      dependencies: {
        "path-to-regexp": self.devDependencies["path-to-regexp"],
      },
      devDependencies: {
        svelte: self.devDependencies.svelte,
      },
    };

    return {
      meta,
      options,
      factory: (sourceFolder) => factory(meta, sourceFolder, options),
    };
  });

export default generator;
