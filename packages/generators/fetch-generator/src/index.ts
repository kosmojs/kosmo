import type { GeneratorConstructor } from "@kosmojs/dev";

import { factory } from "./factory";

export default (): GeneratorConstructor => {
  return {
    name: "Fetch",
    slot: "fetch",
    moduleImport: import.meta.filename,
    moduleConfig: undefined,
    factory,
  };
};
