import createMdxPlugin from "@mdx-js/rollup";
import { createFilter, type Plugin } from "vite";

import type { ProjectSettings, SourceFolder } from "@kosmojs/core";
import { defaults } from "@kosmojs/lib";

import type { Options } from "./types";

export default (
  sourceFolder: SourceFolder,
  command: ProjectSettings["command"],
  options: Options[0] | undefined,
): Array<Plugin> => {
  const { remarkPlugins = [], rehypePlugins = [] } = { ...options };

  const hmrPlugin = (): Plugin => {
    const hmrFilters = [
      `${defaults.srcDir}/${sourceFolder.name}/${defaults.entryDir}/client.tsx`,
    ].map((e) => createFilter(e));

    const hmrFilter = (id: string) => hmrFilters.some((filter) => filter(id));

    const hmrSnippet = `
if (import.meta.hot) {
  import.meta.hot.accept(() => {});
}
`;

    return {
      name: "kosmo:mdx[hmr]",
      enforce: "post", // run after other transforms
      transform(code, id) {
        if (!hmrFilter(id) || code.includes("import.meta.hot.accept")) {
          return;
        }
        return { code: [code, hmrSnippet].join("\n") };
      },
    };
  };

  const plugins: Array<Plugin> = [
    createMdxPlugin({
      jsxImportSource: "preact",
      providerImportSource: "@mdx-js/preact",
      remarkPlugins,
      rehypePlugins,
    }) as Plugin,

    {
      name: "kosmo:mdx[config]",
      enforce: "pre",
      config() {
        return {
          build: {
            ssrEmitAssets: true,
          },
          oxc: {
            jsx: {
              importSource: "preact",
            },
          },
        };
      },
    },
  ];

  if (command === "serve") {
    plugins.push(hmrPlugin());
  }

  return plugins;
};
