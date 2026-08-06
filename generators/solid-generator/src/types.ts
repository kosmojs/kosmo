import type { Options as VitePluginOptions } from "vite-plugin-solid";

import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = VitePluginOptions & {
  templates?: GeneratorCustomTemplates<PageRoute>;
  tanstack?: { query?: boolean };
};
