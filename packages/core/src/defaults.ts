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
  solid = "Solid",
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
export const DEFAULT_PREVIEW_PORT = 4558;

export const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".apng": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};
