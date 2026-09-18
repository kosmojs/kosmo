// retired URL -> its replacement, both as site-absolute .html paths.
// Shared between .vitepress/config.ts (meta-refresh + canonical on the stub pages)
// and scripts/llms.mjs (the stub pages stay out of the llms artifacts).

/** @type {Array<[string, string]>} */
export const redirects = [
  // CLI moved
  ["/essentials/cli.html", "/cli/intro.html"],
  // OpenAPI moved
  ["/openapi.html", "/openapi/intro.html"],
  // Agents notes moved
  ["/agents.html", "/agents/intro.html"],
];
