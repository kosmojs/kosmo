/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */

import type { GeneratorMeta } from "@kosmojs/core";
import self from "@kosmojs/koa-generator/package.json" with { type: "json" };
import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "Koa",
    slot: "api",
    dependencies: {
      koa: self.devDependencies.koa,
      "@koa/router": self.devDependencies["@koa/router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
      cookie: self.devDependencies.cookie,
      formidable: self.devDependencies.formidable,
      "raw-body": self.devDependencies["raw-body"],
    },
    devDependencies: {
      "@types/koa": self.devDependencies["@types/koa"],
      "@types/formidable": self.devDependencies["@types/formidable"],
    },
    types: ["@types/koa"],
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});
