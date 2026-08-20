import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "H3",
    slot: "backend",
  },
  dependencies: {
    h3: self.devDependencies.h3,
  },
  factory,
});
