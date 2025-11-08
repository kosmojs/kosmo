import { join } from "node:path";

import { type BuildOptions, build as esbuild } from "esbuild";
import { build, loadConfigFromFile, type Plugin } from "vite";

import {
  type GeneratorFactory,
  pathResolver,
  renderToFile,
} from "@kosmojs/devlib";

import serverTpl from "./templates/server.hbs";

export const factory: GeneratorFactory = async ({
  appRoot,
  sourceFolder,
  outDir,
  command,
}) => {
  if (command === "build") {
    const { resolve } = pathResolver({ appRoot, sourceFolder });

    const viteConfig = await loadConfigFromFile(
      { command: "build", mode: "ssr" },
      resolve("@", "vite.config.ts"),
    );

    const esbuildOptions: BuildOptions = await import(
      join(appRoot, "esbuild.json"),
      { with: { type: "json" } }
    ).then((e) => e.default);

    const { plugins, ...config } = { ...viteConfig?.config };

    // build the SSR bundle using `entry/server.ts` as the entry point.
    // NOTE: this file is deployed by userland generators,
    // therefore the SSR generator must run last to ensure this file exists.
    await build({
      configFile: false,
      ...config,
      // WARN: excluding basePlugin is essential to avoid an infinite build loop.
      plugins: plugins
        ? plugins.filter((e) => (e as Plugin)?.name !== "@kosmojs:basePlugin")
        : [],
      build: {
        ssr: resolve("entryDir", "server.ts"),
        outDir: join(outDir, "ssr"),
        sourcemap: true,
      },
    });

    const ssrLisbFile = resolve("libDir", sourceFolder, "{ssr}.ts");

    await renderToFile(ssrLisbFile, serverTpl, {
      importPathmap: {
        config: join(sourceFolder, "config"),
      },
    });

    await esbuild({
      ...esbuildOptions,
      bundle: true,
      entryPoints: [ssrLisbFile],
      outfile: join(outDir, "ssr", "index.js"),
    });
  }

  return {
    async watchHandler() {},
  };
};
