import type { Options as VitePluginOptions } from "vite-plugin-solid";

import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = VitePluginOptions & {
  // Custom templates map
  templates?: GeneratorCustomTemplates<PageRoute>;
};
