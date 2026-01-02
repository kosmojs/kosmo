import { join } from "node:path";

import { defaults } from "./defaults";

type CreateImport = Record<
  | "coreApi"
  | "src"
  | "config"
  | "api"
  | "pages"
  | "fetch"
  | "lib"
  | "libApi"
  | "libEntry",
  (...a: Array<string>) => string
>;

export const createTsconfigPaths = (prefix: string) => {
  return {
    [`${defaults.appPrefix}/*`]: [`${prefix}/*`],
    [`${defaults.srcPrefix}/*`]: [`${prefix}/${defaults.srcDir}/*`],
    [`${defaults.libPrefix}/*`]: [
      `${prefix}/${defaults.libDir}/${defaults.srcDir}/*`,
    ],
  };
};

export const pathResolver = ({
  appRoot,
  sourceFolder,
}: {
  appRoot?: string;
  sourceFolder: string;
}): {
  createPath: Record<
    | "coreApi"
    | "src"
    | "config"
    | "api"
    | "pages"
    | "entry"
    | "fetch"
    | "lib"
    | "libApi"
    | "libEntry"
    | "libPages",
    (...a: Array<string>) => string
  >;
  createImport: CreateImport;
  createImportHelper: (k: keyof CreateImport, ...a: Array<string>) => string;
} => {
  const createPath = (...a: Array<string>) => {
    return appRoot ? join(appRoot, ...a) : join(...a);
  };

  const createImport: CreateImport = {
    coreApi(...a) {
      return join(defaults.appPrefix, defaults.coreDir, defaults.apiDir, ...a);
    },
    src(...a) {
      return join(defaults.srcPrefix, sourceFolder, ...a);
    },
    config(...a) {
      return this.src(defaults.configDir, ...a);
    },
    api(...a) {
      return this.src(defaults.apiDir, ...a);
    },
    pages(...a) {
      return this.src(defaults.pagesDir, ...a);
    },
    lib(...a) {
      return join(defaults.libPrefix, sourceFolder, ...a);
    },
    libApi(...a) {
      return this.lib(defaults.apiDir, ...a);
    },
    libEntry(...a) {
      return this.lib(defaults.entryDir, ...a);
    },
    fetch(...a) {
      return this.lib(defaults.fetchDir, ...a);
    },
  };

  return {
    createPath: {
      coreApi(...a) {
        return createPath(defaults.coreDir, defaults.apiDir, ...a);
      },
      src(...a) {
        return createPath(defaults.srcDir, sourceFolder, ...a);
      },
      api(...a) {
        return this.src(defaults.apiDir, ...a);
      },
      pages(...a) {
        return this.src(defaults.pagesDir, ...a);
      },
      config(...a) {
        return this.src(defaults.configDir, ...a);
      },
      entry(...a) {
        return this.src(defaults.entryDir, ...a);
      },
      lib(...a) {
        return createPath(defaults.libDir, defaults.srcDir, sourceFolder, ...a);
      },
      libApi(...a) {
        return this.lib(defaults.apiDir, ...a);
      },
      libEntry(...a) {
        return this.lib(defaults.entryDir, ...a);
      },
      libPages(...a) {
        return this.lib(defaults.pagesDir, ...a);
      },
      fetch(...a) {
        return this.lib(defaults.fetchDir, ...a);
      },
    },
    createImport,
    createImportHelper: (key, ...a) => {
      // Handlebars always appends an options object as the last argument,
      // slice it off before passing args to createImport
      return createImport[key](...a.slice(0, -1));
    },
  };
};
