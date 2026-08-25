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
  svelte = "Svelte",
  mdx = "MDX",
}

export enum BACKENDS {
  hono = "Hono",
  h3 = "H3",
  koa = "Koa",
}

export const DEFAULT_DIST = "dist";
export const DEFAULT_APIBASE = "/api";
export const DEFAULT_PORT = 4556;
