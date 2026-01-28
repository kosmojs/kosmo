import type { IncomingMessage, ServerResponse } from "node:http";
import { join, resolve } from "node:path";
import { styleText } from "node:util";

import { type BuildOptions, context, type Plugin } from "esbuild";

import type { DevSetup } from "@kosmojs/api";

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

  let devSetup: DevSetup | undefined;

  const watcher = async () => {
    const rebuildPlugin: Plugin = {
      name: "rebuild",
      setup(build) {
        build.onEnd(async () => {
          if (devSetup) {
            await devSetup.teardownHandler?.();
          }
          try {
            await import(`${outDir}/dev.js?${Date.now()}`).then((e) => {
              devSetup = e.default;
            });
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
      entryPoints: [createPath.api("dev.ts")],
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
    next: () => void | Promise<void>,
  ) => {
    const {
      requestMatcher = () => {
        return new RegExp(`^${join(baseurl, apiurl)}($|/)`).test(
          req.url as string,
        );
      },
      requestHandler,
    } = { ...devSetup };

    if (!requestMatcher(req)) {
      return next();
    }

    const handler = requestHandler?.();
    return handler ? handler(req, res) : next();
  };

  return {
    watcher,
    devMiddleware,
  };
};
