import { glob } from "node:fs/promises";

export default [
  {
    name: "kosmo:virtualModules",
    enforce: "pre",

    resolveId(source) {
      return source === "virtual:kosmo/env" ? "\0virtual:kosmo/env" : undefined;
    },

    load(id) {
      return id === "\0virtual:kosmo/env"
        ? `export const command = "build";`
        : undefined;
    },
  },
  {
    name: "vite:load-templates",
    enforce: "pre",
    async resolveId(src) {
      if (src.startsWith("#templates/")) {
        const base = src.replace("#templates/", "src/templates/");
        const patterns = [
          // files with explicit extension takes priority
          base,
          `${base}.{ts,tsx}`,
        ];
        for await (const path of glob(patterns)) {
          return `${path}?raw`;
        }
      }
    },
  },
];
