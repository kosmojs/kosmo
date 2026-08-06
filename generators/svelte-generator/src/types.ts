import type { Options as VitePluginOptions } from "@sveltejs/vite-plugin-svelte";

import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = VitePluginOptions & {
  templates?: GeneratorCustomTemplates<PageRoute>;
  tanstack?: { query?: boolean };
};
