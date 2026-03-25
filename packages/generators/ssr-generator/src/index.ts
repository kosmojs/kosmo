import { defineGenerator } from "@kosmojs/lib";

// importing from local rather than published package
// cause no @kosmojs/* dependencies involved.
import self from "../package.json" with { type: "json" };
import factory from "./factory";

export default defineGenerator(() => factory, {
  name: "SSR",
  slot: "ssr",
  dependencies: {
    "path-to-regexp": self.dependencies["path-to-regexp"],
  },
});
