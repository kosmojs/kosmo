import { access, constants } from "node:fs/promises";
import { join, resolve } from "node:path";

import { defaults } from "./defaults";
import type { SourceFolder } from "./types";

type CreateImport = Record<
  "src" | "config" | "api" | "pages" | "lib" | "libApi" | "libEntry",
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

export const pathResolver = (
  sourceFolder: Omit<SourceFolder, "root"> & { root?: string | undefined },
): {
  createPath: Record<
    | "src"
    | "config"
    | "api"
    | "pages"
    | "entry"
    | "lib"
    | "libApi"
    | "libEntry"
    | "libPages"
    | "distDir",
    (...a: Array<string>) => string
  >;
  createImport: CreateImport;
  createImportHelper: (k: keyof CreateImport, ...a: Array<string>) => string;
} => {
  const createPath = (...a: Array<string>) => {
    return sourceFolder.root
      ? resolve(sourceFolder.root, join(...a))
      : join(...a);
  };

  const createImport: CreateImport = {
    src(...a) {
      return join(defaults.srcPrefix, sourceFolder.name, ...a);
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
      return join(defaults.libPrefix, sourceFolder.name, ...a);
    },
    libApi(...a) {
      return this.lib(defaults.apiDir, ...a);
    },
    libEntry(...a) {
      return this.lib(defaults.entryDir, ...a);
    },
  };

  return {
    createPath: {
      src(...a) {
        return createPath(defaults.srcDir, sourceFolder.name, ...a);
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
        return createPath(
          defaults.libDir,
          defaults.srcDir,
          sourceFolder.name,
          ...a,
        );
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
      distDir(...a) {
        return createPath(sourceFolder.distDir, sourceFolder.name, ...a);
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

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};
