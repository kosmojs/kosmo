import { resolve } from "node:path";

import type { PluginOptionsResolved } from "@kosmojs/devlib";

export const appRoot = resolve(import.meta.dirname, "../@fixtures/app");
export const sourceFolder = "@src";

export const pluginOptions: Pick<
  PluginOptionsResolved,
  "appRoot" | "sourceFolder"
> = {
  appRoot,
  sourceFolder,
};
