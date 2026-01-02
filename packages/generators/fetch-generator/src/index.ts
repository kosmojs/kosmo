import type { GeneratorConstructor } from "@kosmojs/dev";

import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "Fetch",
    kind: "fetch",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
  };
};
