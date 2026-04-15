import type { ProcessorOptions } from "@mdx-js/mdx";

import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = [
  {
    remarkPlugins?: ProcessorOptions["remarkPlugins"];
    rehypePlugins?: ProcessorOptions["rehypePlugins"];

    // Custom templates map
    templates?: GeneratorCustomTemplates<PageRoute>;
  },
  false,
];
