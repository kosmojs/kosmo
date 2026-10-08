import { defineGenerator, VERSION } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Vitest",
  },
  dependencies: {},
  devDependencies: {
    "@kosmojs/vitest": `^${VERSION}`,
    vitest: self.devDependencies.vitest,
  },
  factory,
});
