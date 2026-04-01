import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Minimal shape of Vite's manifest.json entries.
 * */
export type SSRManifestEntry = {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  css?: string[];
  assets?: string[];
  imports?: string[];
  dynamicImports?: string[];
};

/**
 * SSR environment options passed to user-defined
 * renderToString / renderToStream functions.
 * */
export type SSROptions = {
  // The original client index.html output from Vite build.
  // Contains <!--app-head--> and <!--app-html--> placeholders
  // where SSR content should be injected.
  template: string;

  // Vite's final manifest.json - the full dependency graph for
  // client modules, dynamic imports, and related CSS.
  manifest: Record<string, SSRManifestEntry>;

  // A list of CSS chunks relevant to the requested URL,
  // determined by resolving the manifest graph back to routes.
  //
  // Each entry includes:
  //   - `text` → decoded CSS content for inline <style> usage
  //   - `path` → the browser-loadable asset path (for <link> usage)
  //
  // What the SSR renderer can do with `criticalCss`:
  //
  //   ✓ Inline style text (<style>…</style>) for fastest first paint
  //   ✓ Insert <link rel="stylesheet" href="..."> for cache reuse
  //   ✓ Insert <link rel="preload" as="style"> for warm loading
  criticalCss: Array<{ text: string; path: string }>;

  // The underlying Node.js HTTP request/response objects.
  //
  // These allow advanced SSR controllers to:
  //   - inspect headers (e.g., UA, cookies, locale)
  //   - set custom response headers (e.g., caching, redirects)
  //   - flush HTML progressively in streaming mode
  //
  // They are provided directly so renderers can choose either:
  //   → high-level HTML return (via renderToString), or
  //   → low-level streaming response control (via renderToStream).
  request: IncomingMessage;
  response: ServerResponse;
};

/**
 * Return type for string-based SSR rendering.
 *
 * - `head` is optional, user may choose to:
 *    - insert the provided critical CSS (opt.criticalCss),
 *    - override it (e.g. remove some styles),
 *    - or supply additional <meta>/<link>/<style> tags.
 *
 * - `html` is the main server-rendered body markup for hydration.
 * */
export type SSRStringReturn = {
  head?: string;
  html: string;
};

/**
 * SSR string mode
 *
 * Returns head + html, synchronously or async.
 *
 * The server will:
 * - insert returned `head` into the HTML template
 * - place returned `html` into the body placeholder
 * */
export type SSRString = (
  url: URL,
  opt: SSROptions,
) => SSRStringReturn | Promise<SSRStringReturn>;

/**
 * SSR stream mode
 *
 * Writes directly to the HTTP response.
 *
 * Responsibility of the user/render function:
 * - insert head + critical CSS at the correct time (before first flush)
 * - manage partial flushing, suspense boundaries, etc.
 *
 * The server will NOT modify the response body in this mode,
 * thus the renderer **must call `response.end()`** when streaming is finished,
 * otherwise the HTTP request will remain open and the client will hang.
 * */
export type SSRStream = (url: URL, opt: SSROptions) => void | Promise<void>;

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup = {
  /**
   * The server calls render functions with current request URL and SSROptions.
   *
   * If both are provided, `renderToStream` takes precedence since streaming
   * enables earlier flushing and improved Time-to-First-Byte (TTFB).
   * `renderToString` will only be used if a streaming renderer is not available.
   * */
  renderToString?: SSRString;
  renderToStream?: SSRStream;

  /**
   * Controls whether the SSR server should handle static asset requests (JS, CSS, images, fonts, etc.)
   *
   *   true  (default)
   *     → All built client assets are served directly from memory by SSR server.
   *     → Easiest setup - no external file server required.
   *
   *   false
   *     → A reverse proxy/CDN *must* serve all static files.
   *     → Otherwise any asset URL requested from browser (JS/CSS/img) will return `404`.
   *
   * Notes:
   *   - `criticalCss.text` can still be inlined regardless of this setting.
   *   - `criticalCss.url` remains provided for `<link>` usage,
   *     but loading that URL is the responsibility of the external static server.
   *
   * This option enables deployments where SSR and static delivery
   * are cleanly separated (e.g., Node behind nginx / cloud static hosting).
   * */
  serveStaticAssets?: boolean;

  /**
   * Handle NotFound errors
   * */
  notFound: SSRString;
};

export type SSRFactory = (factory: () => SSRSetup) => SSRSetup;
