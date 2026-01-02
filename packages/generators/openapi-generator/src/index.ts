import type { GeneratorConstructor } from "@kosmojs/dev";

import { factory } from "./factory";
import type { Options } from "./types";

export default (openapiOptions: Options): GeneratorConstructor => {
  return {
    name: "OpenAPI",
    moduleImport: import.meta.filename,
    moduleConfig: openapiOptions,
    factory: (options) => factory(options, openapiOptions),
    options: {
      resolveTypes: true,
    },
  };
};
