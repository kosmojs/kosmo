import type { Options as VitePluginOptions } from "@vitejs/plugin-react";

import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = VitePluginOptions & {
  templates?: GeneratorCustomTemplates<PageRoute>;
  tanstack?: { query?: boolean };
};
