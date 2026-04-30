import { glob } from "node:fs/promises";

export default [
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
