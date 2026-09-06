import type { SSROptions } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator<SSROptions>({
  meta: {
    name: "SSR",
    slot: "ssr",
  },
  dependencies: {
    tinyglobby: self.devDependencies["tinyglobby"],
    hono: self.devDependencies["hono"],
    "@hono/node-server": self.devDependencies["@hono/node-server"],
  },
  factory,
});
