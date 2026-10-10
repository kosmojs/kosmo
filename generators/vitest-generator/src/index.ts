import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Vitest",
  },
  devDependencies: {
    vitest: self.devDependencies.vitest,
  },
  factory,
});
