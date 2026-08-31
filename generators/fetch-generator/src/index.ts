import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Fetch",
    slot: "fetch",
  },
  dependencies: {
    "light-my-request": self.devDependencies["light-my-request"],
  },
  factory,
});
