export type Options = {
  /**
   * renderMode defaults to "string" for all routes.
   * To use streaming SSR for all routes, set `renderMode: "stream"`.
   * To use streaming for only some routes, match them by glob pattern:
   *
   *   renderMode: {
   *     "docs/*": "stream",
   *   }
   *
   * "docs/*" matches only routes directly under docs; use "docs/**" to match
   * routes at any level. Unmatched routes fall back to "string".
   *
   * Patterns can also be combined to invert the default - opt specific routes
   * into "string", then stream everything else:
   *
   *   renderMode: {
   *     "users/**": "string",
   *     "**": "stream",
   *   }
   *
   * When a route matches multiple patterns, the first match wins - order keys
   * from specific to general.
   *
   * Note: key order follows object insertion order, which does not hold for
   * integer-like keys - a pattern starting with a numeric segment, eg.
   * "2024/**", is hoisted to the front by the JS engine and will match before
   * any pattern written above it. Prefix such patterns with "./" to keep them
   * ordered as written, eg. "./2024/**" - the "./" is stripped when matching.
   * */
  renderMode?: "string" | "stream" | Record<string, "string" | "stream">;
};
