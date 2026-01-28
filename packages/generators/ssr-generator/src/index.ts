import type { GeneratorConstructor } from "@kosmojs/dev";

import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "SSR",
    slot: "ssr",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
  };
};
