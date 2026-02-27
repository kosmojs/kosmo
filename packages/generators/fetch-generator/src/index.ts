import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "Fetch",
    slot: "fetch",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
    dependencies: {
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
  };
};
