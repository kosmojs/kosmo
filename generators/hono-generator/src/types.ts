import type { Plugin } from "vite";

import type { ApiRoute, GeneratorCustomTemplates } from "@kosmojs/core";

export type Options = [
  {
    /**
     * Controls which dependencies are bundled into the output.
     * By default, all dependencies are externalized.
     * Use `noExternal: true` to bundle all dependencies.
     * */
    external?: true | Array<string>;
    noExternal?: true | string | RegExp | Array<string | RegExp>;

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

    /**
     * Vite plugins to be used on backend build and dev server
     * */
    plugins?: Array<Plugin>;

    /**
     * Emit static assets during the SSR/backend build.
     *
     * Vite skips asset emission in SSR builds by default, assuming a companion
     * client build already wrote them to disk. A backend-only build has no such
     * companion, so any import that resolves to a *path on disk*
     * would dangle at runtime. Applies to ?url and asset-graph references:
     *
     *   import geoip from "@/files/GeoIP2-Country.mmdb?url";
     *   const lookup = new Reader<CountryResponse>(
     *     readFileSync(new URL(geoip, import.meta.url)),
     *   );
     *
     * Resolve at the call site with `new URL(asset, import.meta.url)` so the path
     * is relative to the emitting module - robust to chunk relocation, and keeps
     * ?url consistently typed as `string` across frontend/backend builds. Paired
     * with experimental.renderBuiltUrl returning the bare filename for SSR assets
     * (otherwise the default `base` prefix yields an unusable leading "/").
     *
     * Does NOT apply to content-inlining imports - those bundle the bytes straight
     * into the JS and need no emitted file:
     *   ?raw (string)
     *   ?inline (data URL)
     *   ?arraybuffer / ?uint8array (typed array)
     *
     * Safe to ignore this option if the backend uses only inlining imports.
     * */
    emitAssets: boolean;
  },
  false,
];
