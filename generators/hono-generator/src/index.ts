import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Hono",
    slot: "backend",
  },
  dependencies: {
    hono: self.devDependencies.hono,
    "@hono/node-server": self.devDependencies["@hono/node-server"],
  },
  factory,
});
