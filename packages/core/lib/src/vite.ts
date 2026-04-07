import { builtinModules } from "node:module";

import type { Plugin } from "vite";

const nodePrefix = (): Plugin => {
  return {
    name: "kosmojs:node-prefix",
    enforce: "pre",
    resolveId(source) {
      return builtinModules.includes(source)
        ? { id: `node:${source}`, external: true }
        : undefined;
    },
  };
};

export const vitePlugins = {
  api: () => [nodePrefix()],
  ssr: () => [nodePrefix()],
};
