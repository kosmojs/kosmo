import type { GeneratorConstructor } from "@kosmojs/dev";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/hono-generator/package.json" with { type: "json" };

import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "Api",
    slot: "api",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
    dependencies: {
      "@kosmojs/api": self.version,
      hono: self.devDependencies.hono,
      "@hono/node-server": self.devDependencies["@hono/node-server"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  };
};
