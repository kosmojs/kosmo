import { createFilter, type Plugin } from "vite";

import {
  defaults,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";

export default (
  sourceFolder: SourceFolder,
  command: ProjectSettings["command"],
): Array<Plugin> => {
  const hmrPlugin = (): Plugin => {
    const hmrFilters = [
      `${defaults.srcDir}/${sourceFolder.name}/${defaults.entryDir}/client.ts`,
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

  const plugins: Array<Plugin> = [];

  if (command === "serve") {
    plugins.push(hmrPlugin());
  }

  return plugins;
};
