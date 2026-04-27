export const defaults = {
  appPrefix: "@",
  srcPrefix: "~",
  libPrefix: "_",

  coreDir: "core",
  srcDir: "src",
  libDir: "lib",

  configDir: "config",
  apiDir: "api",
  pagesDir: "pages",
  entryDir: "entry",
  fetchDir: "fetch",

  refineTypeName: "VRefine",
};

export enum FRAMEWORKS {
  react = "React",
  vue = "Vue",
  solid = "SolidJS",
  mdx = "MDX",
}

export enum BACKEND_FRAMEWORKS {
  hono = "Hono",
  koa = "Koa",
}

export const DEFAULT_DIST = "dist";
export const DEFAULT_BASE = "/";
export const DEFAULT_APIBASE = "/api";
export const DEFAULT_PORT = 4556;
export const DEFAULT_FRAMEWORK = "none";
export const DEFAULT_BACKEND = "none";
