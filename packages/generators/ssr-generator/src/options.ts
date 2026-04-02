export type Options = [
  {
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
  },
  false,
];
