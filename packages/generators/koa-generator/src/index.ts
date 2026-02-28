import type { GeneratorConstructor } from "@kosmojs/dev";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/koa-generator/package.json" with { type: "json" };

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
      koa: self.devDependencies.koa,
      "@koa/router": self.devDependencies["@koa/router"],
      typebox: self.devDependencies.typebox,
      qs: self.devDependencies.qs,
      cookie: self.devDependencies.cookie,
      formidable: self.devDependencies.formidable,
      "raw-body": self.devDependencies["raw-body"],
    },
    devDependencies: {
      "@types/koa": self.devDependencies["@types/koa"],
      "@types/qs": self.devDependencies["@types/qs"],
      "@types/formidable": self.devDependencies["@types/formidable"],
    },
  };
};

export * from "./templates/lib/api";
export * from "./templates/lib/api:route";
