import { defineGenerator } from "@kosmojs/lib";
/**
 * Import from published package to ensure correct version at runtime.
 * Local import would be bundled with pre-bump version.
 * */
import self from "@kosmojs/react-generator/package.json" with { type: "json" };

import factory from "./factory";
import type { Options } from "./types";

export default defineGenerator<Options>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "React",
    dependencies: {
      react: self.devDependencies.react,
      "react-router": self.devDependencies["react-router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@kosmojs/lib": self.version,
      "@vitejs/plugin-react": self.devDependencies["@vitejs/plugin-react"],
      "@types/react": self.devDependencies["@types/react"],
      "@types/react-dom": self.devDependencies["@types/react-dom"],
      "react-dom": self.devDependencies["react-dom"],
    },
  },
);
