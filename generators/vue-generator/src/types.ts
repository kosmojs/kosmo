import type { GeneratorCustomTemplates, PageRoute } from "@kosmojs/core";

export type Options = [
  {
    // Custom templates map
    templates?: GeneratorCustomTemplates<PageRoute>;
  },
  false,
];
