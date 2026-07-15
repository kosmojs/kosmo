import type { StreamingApi } from "hono/utils/stream";
import type { Manifest } from "vite";
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
  manifest: Manifest;

  // SSR-related assets, must be injected manually (unlike CSR assets that are injected by Vite).
  // Each entry provides three ways to consume the asset:
  //   - `tag`: ready-to-use HTML tag (<script> or <link>) for direct injection
  //   - `path`: asset URL for building custom tags with additional attributes
  //   - `content`: raw file contents for inlining as <style> or inline <script>
  // `size` is included for Content-Length or preload hints.
  assets: Array<{
    kind: "js" | "css";
    tag: string;
    content: string;
    size?: number;
    path?: string;
  }>;
};

/**
 * Return type for string-based SSR rendering.
 * - `head` is optional, user may choose to supply additional <meta>/<link>/<style> tags.
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
export type SSRString = (url: URL, opt: SSROptions) => Promise<SSRStringReturn>;

/**
 * SSR stream mode
 *
 * Writes directly to the HTTP response.
 *
 * Responsibility of the user/render function:
 * - insert head at the correct time (before first flush)
 * - manage partial flushing, suspense boundaries, etc.
 *
 * The server will NOT modify the response body in this mode,
 * thus the renderer **must call `response.end()`** when streaming is finished,
 * otherwise the HTTP request will remain open and the client will hang.
 * */
export type SSRStream = (
  url: URL,
  opt: SSROptions,
  stream: StreamingApi,
) => Promise<void>;

/**
 * A fetch exchange captured during SSR, to be embedded in the HTML
 * and replayed by the hydrating client instead of re-fetching.
 * */
export type SSRSerializedFetch = {
  key: string;
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: string | null;
};

export type SSRRequestContext = {
  headers?: HeadersInit;
  dehydrated?: Array<SSRSerializedFetch>;
};

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup = {
  /**
   * Renders the matched route to a complete HTML string.
   *
   * Required - used in both dev and production:
   * - Dev: always used (streaming is not supported in Vite middleware mode).
   * - Production: used when no `renderToStream` provided.
   * */
  renderToString: SSRString;

  /**
   * Renders the matched route as a progressive HTML stream.
   *
   * Optional - production only. When provided, takes precedence over
   * `renderToString` for improved Time-to-First-Byte (TTFB) by flushing
   * HTML chunks as they become available. Ignored in dev mode.
   * */
  renderToStream?: SSRStream;
};

export type SSRFactory = (factory: () => SSRSetup) => SSRSetup;
