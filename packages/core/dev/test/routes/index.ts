import { resolve } from "node:path";

import type { PluginOptionsResolved } from "@src/types";

export const appRoot = resolve(import.meta.dirname, "../@fixtures/app");
export const sourceFolder = "test";

export const pluginOptions: Pick<
  PluginOptionsResolved,
  "appRoot" | "sourceFolder"
> = {
  appRoot,
  sourceFolder,
};
