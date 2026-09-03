import type { StreamingApi } from "hono/utils/stream";
import type { Manifest } from "vite";

/**
 * SSR string mode
 *
 * Returns head + html
 *
 * The server will:
 * - insert returned `head` into the HTML template
 * - place returned `html` into the body placeholder
 * */
export type RenderToStringOptions = {
  /**
   * The original client index.html output from Vite build.
   * Contains <!--app-html--> placeholder where SSR content is injected by the server.
   * */
  template: string;

  /**
   * Vite's final manifest.json - the full dependency graph for
   * client modules, dynamic imports, and related CSS.
   * */
  manifest: Manifest;

  /**
   * SSR-related assets, must be injected manually (unlike CSR assets that are injected by Vite).
   * Each entry provides ways to consume the asset:
   *   - `tag`: ready-to-use HTML tag (<script> or <link>) for direct injection
   *   - `content`: raw file contents for inlining as <style> or inline <script>
   *   - `path`: asset URL for building custom tags with additional attributes.
   *     Optional - some assets are content-only (eg. an inlined script or style)
   *     and have no standalone URL.
   * `size` is included for Content-Length or preload hints.
   * */
  assets: Array<{
    kind: "js" | "css";
    tag: string;
    content: string;
    size: number;
    path?: string;
  }>;
};

export type RenderToStringReturn = {
  // used to supply additional <meta>/<link>/<style> tags.
  head?: string;
  // html is the main server-rendered body markup for hydration.
  html: string;
};

export type RenderToString = (
  url: URL,
  opt: RenderToStringOptions,
) => Promise<RenderToStringReturn>;

export type RenderToStringWrapperOptions<
  //
  T extends object | undefined = {},
> = ([T] extends [undefined] ? {} : T) & {
  headerTags?: Array<string>;
  context?: Record<string, unknown>;
};

export type RenderToStringWrapper<T, O extends object | undefined = {}> = (
  r: T,
  o: RenderToStringWrapperOptions<O>,
) => Promise<RenderToStringReturn>;

/**
 * SSR stream mode
 *
 * The renderer returns the rendered app as a ReadableStream; the server
 * writes the opening HTML (with `head` injected), pipes `html` into the
 * response, then writes the closing HTML and ends the stream.
 *
 * The renderer does NOT write to the response or close it - `stream` is
 * passed only as an escape hatch for advanced cases (custom flushing,
 * interleaved writes, framework-specific streaming strategies).
 * */
export type RenderToStreamOptions = RenderToStringOptions;

export type RenderToStreamReturn = {
  // used to supply additional <meta>/<link>/<style> tags.
  head?: string;
  // html is the framework's rendered app stream, piped into the response
  // between the opening and closing HTML.
  html: ReadableStream;
};

export type RenderToStream = (
  url: URL,
  opt: RenderToStringOptions,
  stream: StreamingApi,
) => Promise<RenderToStreamReturn>;

export type RenderToStreamWrapperOptions<
  //
  T extends object | undefined = {},
> = RenderToStringWrapperOptions<T>;

export type RenderToStreamWrapper<T, O extends object | undefined = {}> = (
  r: T,
  o: RenderToStreamWrapperOptions<O>,
) => Promise<RenderToStreamReturn>;

/**
 * Default exported object from the SSR entry module (e.g. entry/server.ts).
 * */
export type SSRSetup<StreamImplementationRequired extends boolean = true> = {
  onError?: (e: Error & { url: string }) => void | undefined;
  renderToString: RenderToString;
} & (StreamImplementationRequired extends true
  ? { renderToStream: RenderToStream }
  : {});

export type SSRFactory<StreamImplementationRequired extends boolean = true> = (
  factory: () => SSRSetup<StreamImplementationRequired>,
) => SSRSetup<StreamImplementationRequired>;

export type SSRRenderWrapper = <T>(
  context: { headers?: HeadersInit; url?: string },
  render: () => T,
) => T;
