import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "SSR",
    slot: "ssr",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
    dependencies: {
      "path-to-regexp": self.dependencies["path-to-regexp"],
    },
  };
};
