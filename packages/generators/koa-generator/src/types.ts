import type { ApiRoute, GeneratorCustomTemplates } from "@kosmojs/core";

export type Options = [
  {
    /**
     * Controls which dependencies are bundled into the output.
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
     * Maps custom URLs to existing named routes.
     *
     * The key is the URL to be served (must be absolute and wont be prefixed by the router's base).
     * The value is the name of the route that should handle the request.
     *
     * If the URL includes dynamic segments (e.g. `[id]`),
     * they must exactly match the parameter names expected by the target route.
     * Otherwise, the request may result in a 404.
     *
     * Example:
     *   alias: {
     *     "/feed.xml": "rssFeed",        // served at /feed.xml, handled by "rssFeed" route
     *     "/members/:id": "users/:id",  // :id param must match exactly
     *   }
     * */
    alias?: Record<
      string, // Absolute public URL (not prefixed by router's base)
      string // Name of the route to handle the URL
    >;

    templates?: GeneratorCustomTemplates<ApiRoute>;
  },
  false,
];
