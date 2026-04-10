import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "SolidJS",
    dependencies: {
      "solid-js": self.devDependencies["solid-js"],
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "vite-plugin-solid": self.devDependencies["vite-plugin-solid"],
    },
    jsxImportSource: "solid-js",
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});
