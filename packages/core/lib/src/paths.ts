import { access, constants } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { SourceFolder } from "@kosmojs/core";

import { defaults } from "./defaults";

type Options = { origin: "src" | "lib" };

type CreateImport = Record<
  "src" | "config" | "api" | "pages" | "lib" | "libApi" | "libEntry",
  (a: Array<string>, o: Options) => string
>;

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
  createImportHelpers: (o: Options) => {
    createImport: (k: keyof CreateImport, ...a: Array<string>) => string;
  };
} => {
  const createPath = (...a: Array<string>) => {
    return sourceFolder.root
      ? resolve(sourceFolder.root, join(...a))
      : join(...a);
  };

  const createImport: CreateImport = {
    src(a, { origin }) {
      return origin === "src"
        ? join(defaults.srcPrefix, ...a)
        : join(defaults.appPrefix, defaults.srcDir, sourceFolder.name, ...a);
    },
    config(a, o) {
      return this.src([defaults.configDir, ...a], o);
    },
    api(a, o) {
      return this.src([defaults.apiDir, ...a], o);
    },
    pages(a, o) {
      return this.src([defaults.pagesDir, ...a], o);
    },
    lib(a, { origin }) {
      return origin === "src"
        ? join(defaults.libPrefix, ...a)
        : join(defaults.appPrefix, defaults.libDir, sourceFolder.name, ...a);
    },
    libApi(a, o) {
      return this.lib([defaults.apiDir, ...a], o);
    },
    libEntry(a, o) {
      return this.lib([defaults.entryDir, ...a], o);
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
        return createPath(defaults.libDir, sourceFolder.name, ...a);
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
    createImportHelpers(o) {
      if (!["src", "lib"].includes(o?.origin)) {
        throw new Error(
          `createImportHelpers: required exactly one argument of shape { origin: "src|lib" }`,
        );
      }
      return {
        createImport(key, ...a) {
          // Handlebars appends an options object as the last argument,
          // slice it off before passing args to createImport
          return createImport[key](a.slice(0, -1), o);
        },
      };
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
