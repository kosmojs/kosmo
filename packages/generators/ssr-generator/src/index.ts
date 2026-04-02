import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

// importing from local rather than published package
// cause no @kosmojs/* dependencies involved.
import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./options";

export default defineGenerator<Options>((options) => {
  const meta: GeneratorMeta = {
    name: "SSR",
    slot: "ssr",
    dependencies: {
      tinyglobby: self.devDependencies["tinyglobby"],
      hono: self.devDependencies["hono"],
      "@hono/node-server": self.devDependencies["@hono/node-server"],
    },
  };

  return {
    meta,
    options,
    factory: (sourceFolder) => factory(meta, sourceFolder, options),
  };
});
