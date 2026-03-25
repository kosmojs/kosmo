import { resolve } from "node:path";

import type { SourceFolder } from "@src/types";

export const appRoot = resolve(import.meta.dirname, "../@fixtures/app");

export const sourceFolder: SourceFolder = {
  root: appRoot,
  name: "test",
  config: {
    baseurl: "",
    apiurl: "",
    generators: [
      // providing a stub generator with options.resolveTypes
      {
        name: "",
        moduleConfig: {},
        moduleImport: "",
        async factory() {
          return { async watch() {}, async build() {} };
        },
        options: { resolveTypes: true },
      },
    ],
  },
  viteConfig: {} as never,
  distDir: "",
};
