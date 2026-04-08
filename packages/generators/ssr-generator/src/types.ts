export type Options = [
  {
    /**
     * Controls which dependencies are bundled into the SSR output.
     *
     * By default, all dependencies declared by active generators are bundled,
     * producing a single self-contained file that runs without node_modules.
     *
     * Override this to reduce bundle size at the cost of requiring node_modules at runtime:
     * - `[]` - bundle nothing, all dependencies resolved from node_modules
     * - `["preact", "hono"]` - bundle only the specified packages
     * */
    noExternal?: Array<string>;

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
     * */
    serveStaticAssets?: boolean;

    /**
     * SSG disabled by default, set this to true to enable
     * */
    ssg?: boolean;
  },
  false,
];
