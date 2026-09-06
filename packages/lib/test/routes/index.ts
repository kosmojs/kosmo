import { resolve } from "node:path";

import type { SourceFolder } from "@kosmojs/core";

export const appRoot = resolve(import.meta.dirname, "../@fixtures/app");

export const sourceFolder: SourceFolder = {
  root: appRoot,
  name: "test",
  config: {
    generators: [
      // providing a stub generator with options.resolveTypes
      {
        meta: { name: "" },
        factory() {
          return {
            meta: { name: "" },
            async watch() {},
            async build() {},
          };
        },
        options: { resolveTypes: true },
      },
    ],
  },
  distDir: "",
};
