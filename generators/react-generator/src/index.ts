import { defineGenerator } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>({
  meta: {
    name: "React",
    dependencies({ generators }) {
      return {
        react: self.devDependencies.react,
        "react-router": self.devDependencies["react-router"],
        "path-to-regexp": self.devDependencies["path-to-regexp"],
        ...(generators.some((e) => e.meta.slot === "tsq")
          ? {
              "@tanstack/react-query":
                self.devDependencies["@tanstack/react-query"],
            }
          : {}),
      };
    },
    devDependencies: {
      "@types/react": self.devDependencies["@types/react"],
      "@types/react-dom": self.devDependencies["@types/react-dom"],
      "react-dom": self.devDependencies["react-dom"],
    },
    jsx: "preserve",
    jsxImportSource: "react",
  },
  factory,
});
