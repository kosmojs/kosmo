import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/mdx-generator/package.json" with { type: "json" };

import factory from "./factory";
import plugins from "./plugins";
import type { Options } from "./types";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "MDX",
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      preact: self.devDependencies.preact,
      "preact-render-to-string":
        self.devDependencies["preact-render-to-string"],
      "@mdx-js/preact": self.devDependencies["@mdx-js/preact"],
      "remark-frontmatter": self.devDependencies["remark-frontmatter"],
      "remark-mdx-frontmatter": self.devDependencies["remark-mdx-frontmatter"],
    },
    jsxImportSource: "preact",
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
    plugins: (sourceFolder, command) => plugins(sourceFolder, command, options),
  };
});
