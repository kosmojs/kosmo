import type { GeneratorConstructor } from "@kosmojs/devlib";

import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "SSR",
    kind: "ssr",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
  };
};
