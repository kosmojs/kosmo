import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "MDX",
    slot: "frontend",
    jsx: "react-jsx",
    jsxImportSource: "preact",
  },
  dependencies: {
    preact: self.devDependencies.preact,
    "preact-render-to-string": self.devDependencies["preact-render-to-string"],
    "@mdx-js/preact": self.devDependencies["@mdx-js/preact"],
    "remark-frontmatter": self.devDependencies["remark-frontmatter"],
    "remark-mdx-frontmatter": self.devDependencies["remark-mdx-frontmatter"],
  },
  factory,
});
