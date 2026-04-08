import type { GeneratorMeta } from "@kosmojs/core";
import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";

export default defineGenerator(() => {
  const meta: GeneratorMeta = {
    name: "SSG",
    slot: "ssg",
  };

  return {
    meta,
    factory: (sourceFolder) => factory(meta, sourceFolder),
  };
});
