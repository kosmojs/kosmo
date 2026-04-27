import { glob } from "tinyglobby";

export default [
  {
    name: "vite:load-templates",
    enforce: "pre",
    async resolveId(src) {
      if (src.startsWith("#templates/")) {
        const base = src.replace("#templates/", "src/templates/");
        const [path] = await glob(
          [
            // files with explicit extension takes priority
            base,
            `${base}.{ts,tsx}`,
          ],
          {
            absolute: true,
            onlyFiles: true,
          },
        );
        if (path) {
          return `${path}?raw`;
        }
      }
    },
  },
];
