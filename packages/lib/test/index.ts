import { resolve } from "node:path";

import type { ProjectSettings, SourceFolder } from "@kosmojs/core";

export const sourceFolder: SourceFolder = {
  name: "test",
  config: {},
  generators: [
    // providing a stub generator with options.resolveTypes
    {
      meta: { name: "" },
      factory() {
        return {
          meta: { name: "" },
          async seed() {},
          async watch() {},
          async build() {},
        };
      },
      options: { resolveTypes: true },
    },
  ],
};

export const project: ProjectSettings = {
  root: resolve(import.meta.dirname, "@fixtures/app"),
  sourceFolders: [sourceFolder],
  devHost: "",
  previewHost: "",
  distDir: "/dev/null",
};
