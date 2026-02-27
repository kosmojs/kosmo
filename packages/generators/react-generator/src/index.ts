import type { GeneratorConstructor } from "@kosmojs/dev";

import self from "../package.json" with { type: "json" };
import { factory } from "./factory";
import type { Options } from "./types";

export default (options?: Options): GeneratorConstructor => {
  return {
    name: "React",
    moduleImport: import.meta.filename,
    moduleConfig: options,
    factory: (...args) => factory(...args, { ...options }),
    dependencies: {
      react: self.devDependencies.react,
      "react-router": self.devDependencies["react-router"],
      "path-to-regexp": self.devDependencies["path-to-regexp"],
    },
    devDependencies: {
      "@vitejs/plugin-react": self.devDependencies["@vitejs/plugin-react"],
      "@types/react": self.devDependencies["@types/react"],
      "@types/react-dom": self.devDependencies["@types/react-dom"],
      "react-dom": self.devDependencies["react-dom"],
    },
  };
};
