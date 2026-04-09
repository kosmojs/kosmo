import type { ProcessorOptions } from "@mdx-js/mdx";

export type Options = [
  {
    remarkPlugins?: ProcessorOptions["remarkPlugins"];
    rehypePlugins?: ProcessorOptions["rehypePlugins"];

    // Custom templates map
    templates?: Record<
      // page name pattern
      string,
      // template itself, not path to template file
      string
    >;
  },
  false,
];
