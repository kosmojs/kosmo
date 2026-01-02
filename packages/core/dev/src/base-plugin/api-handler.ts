import type { IncomingMessage, ServerResponse } from "node:http";
import { join, resolve } from "node:path";
import { styleText } from "node:util";

import { type BuildOptions, context, type Plugin } from "esbuild";

import type { App } from "@kosmojs/api";

import { defaults } from "@/defaults";
import { pathResolver } from "@/paths";
import type { PluginOptionsResolved } from "@/types";

export default async (options: PluginOptionsResolved) => {
  const { appRoot, sourceFolder, baseurl, apiurl } = options;
  const { createPath } = pathResolver({ appRoot, sourceFolder });

  const outDir = join(options.outDir, defaults.apiDir);

  const esbuildOptions: BuildOptions = await import(
    resolve(appRoot, "esbuild.json"),
    { with: { type: "json" } }
  ).then((e) => e.default);

  let app: App;
  let devMiddlewareFactory: Function | undefined;
  let teardownHandler: Function | undefined;

  const watcher = async () => {
    const rebuildPlugin: Plugin = {
      name: "rebuild",
      setup(build) {
        build.onEnd(async () => {
          if (app) {
            await teardownHandler?.(app);
          }
          try {
            const exports = await import(`${outDir}/app.js?${Date.now()}`);
            devMiddlewareFactory = exports.devMiddlewareFactory;
            teardownHandler = exports.teardownHandler;
            app = await exports.default();
            console.debug(`${styleText("green", "➜")} Api handler ready`);
          } catch (error) {
            console.error(`${styleText("red", "✗")} Api handler error`);
            console.error(error);
          }
        });
      },
    };

    const ctx = await context({
      ...esbuildOptions,
      logLevel: "error",
      bundle: true,
      entryPoints: [createPath.api("app.ts")],
      plugins: [rebuildPlugin],
      outdir: outDir,
    });

    return {
      async start() {
        await ctx.watch({
          // waits this many milliseconds before rebuilding after a change is detected
          delay: options.watcher.delay,
        });
      },
      async stop() {
        await ctx.dispose();
      },
    };
  };

  const devMiddleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    viteHandler: () => void,
  ) => {
    const next = () => {
      return viteHandler();
    };
    if (devMiddlewareFactory) {
      const handler = devMiddlewareFactory(app);
      await handler(req, res, next);
    } else {
      !req?.url || !new RegExp(`^${join(baseurl, apiurl)}($|/)`).test(req.url)
        ? next() // do not await here
        : await app?.callback()(req, res);
    }
  };

  return {
    watcher,
    devMiddleware,
  };
};
