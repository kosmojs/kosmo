import { defineGenerator } from "@kosmojs/lib";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/solid-generator/package.json" with { type: "json" };

import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "SolidJS",
    dependencies: {
      "@solidjs/router": self.devDependencies["@solidjs/router"],
      "solid-js": self.devDependencies["solid-js"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@kosmojs/lib": self.version,
      "vite-plugin-solid": self.devDependencies["vite-plugin-solid"],
    },
  },
);
