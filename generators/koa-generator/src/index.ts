import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "Koa",
    slot: "api",
    types: ["@types/koa"],
    dependencies: {
      koa: self.devDependencies.koa,
      "@koa/router": self.devDependencies["@koa/router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
      formidable: self.devDependencies.formidable,
      "raw-body": self.devDependencies["raw-body"],
    },
    devDependencies: {
      "@types/koa": self.devDependencies["@types/koa"],
      "@types/formidable": self.devDependencies["@types/formidable"],
    },
  },
  factory,
});
