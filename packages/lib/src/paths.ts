import { access, constants } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  DEFAULT_DIST,
  defaults,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";

type Options = { origin: "src" | "lib" };

type CreateImport = Record<
  | "app"
  | "appSrc"
  | "appLib"
  | "src"
  | "api"
  | "entry"
  | "pages"
  | "lib"
  | "libCore"
  | "libApi"
  | "libEntry",
  (a: Array<string>, o: Options) => string
>;

export const pathResolver = (
  { root, distDir = DEFAULT_DIST }: ProjectSettings,
  { name }: SourceFolder,
): {
  createPath: Record<
    | "app"
    | "appSrc"
    | "appLib"
    | "src"
    | "api"
    | "pages"
    | "entry"
    | "lib"
    | "libCore"
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
    return root ? resolve(root, join(...a)) : join(...a);
  };

  const createImport: CreateImport = {
    app(a) {
      return join(defaults.appPrefix, ...a);
    },
    appSrc(a) {
      return join(defaults.appSrcPrefix, name, ...a);
    },
    appLib(a) {
      return join(defaults.appLibPrefix, name, ...a);
    },
    src(a, o) {
      return o.origin === "src"
        ? join(defaults.srcPrefix, ...a)
        : this.appSrc(a, o);
    },
    api(a, o) {
      return this.src([defaults.apiDir, ...a], o);
    },
    entry(a, o) {
      return this.src([defaults.entryDir, ...a], o);
    },
    pages(a, o) {
      return this.src([defaults.pagesDir, ...a], o);
    },
    lib(a, o) {
      return o.origin === "src"
        ? join(defaults.libPrefix, ...a)
        : this.appLib(a, o);
    },
    libCore(a, o) {
      return this.lib(["core", ...a], o);
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
      app(...a) {
        return createPath(...a);
      },
      appSrc(...a) {
        return createPath(defaults.srcDir, ...a);
      },
      appLib(...a) {
        return createPath(defaults.varDir, defaults.libDir, ...a);
      },
      src(...a) {
        return this.appSrc(name, ...a);
      },
      api(...a) {
        return this.src(defaults.apiDir, ...a);
      },
      pages(...a) {
        return this.src(defaults.pagesDir, ...a);
      },
      entry(...a) {
        return this.src(defaults.entryDir, ...a);
      },
      lib(...a) {
        return this.appLib(name, ...a);
      },
      libCore(...a) {
        return this.lib("core", ...a);
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
        return createPath(distDir, name, ...a);
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
  return access(path, constants.F_OK).then(
    () => true,
    () => false,
  );
};
