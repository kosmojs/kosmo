import type { PluginOption, UserConfig } from "vite";

import type { BACKENDS, FRONTENDS } from "../defaults";
import type {
  GeneratorCustomTemplates,
  GeneratorSignature,
} from "./generators";
import type { ApiRoute, PageRoute } from "./routes";
import type { TypeboxSettings, TypeboxValidationMessages } from "./typebox";

export type ViteConfig = Omit<
  UserConfig,
  "root" | "base" | "cacheDir" | "mode" | "builder" | "future" | "legacy"
>;

type FrontendStack = keyof typeof FRONTENDS;
type BackendStack = keyof typeof BACKENDS;

export type FrontendOptions = {
  stack: FrontendStack | { name: FrontendStack; plugin: PluginOption };
  base: string;
  fetch?: boolean | { generator?: GeneratorSignature };
  ssr?: boolean | SSROptions | { generator?: GeneratorSignature<SSROptions> };
  ssg?: boolean | { generator?: GeneratorSignature };
  tanstack?: { query?: boolean };
  templates?: GeneratorCustomTemplates<PageRoute>;
  generator?: GeneratorSignature;
  viteConfig?: ViteConfig;
};

export type BackendOptions = {
  stack: BackendStack | { name: BackendStack };
  base: string;

  openapi?: OpenAPIOptions | { generator?: GeneratorSignature<OpenAPIOptions> };

  /**
   * Maps custom URLs to existing named routes.
   *
   * The key is the URL to be served (must be absolute and wont be prefixed by the router's base).
   * The value is the name of the route that should handle the request.
   *
   * If the route includes dynamic segments (e.g. `[id]`),
   * they must exactly match the parameter names expected by the target route.
   * Positions may differ, but presence and name/kind must match exactly.
   * Otherwise, the request may result in a 404.
   *
   * Example:
   *   alias: {
   *     "/feed.xml": "rssFeed",        // served at /feed.xml, handled by "rssFeed" route
   *     "/members/[id]": "users/[id]", // params must match exactly
   *   }
   * */
  alias?: Record<
    string, // Absolute public URL (not prefixed by router's base)
    string // Name of the route to handle the URL
  >;

  templates?: GeneratorCustomTemplates<ApiRoute>;
  generator?: GeneratorSignature;
  viteConfig?: ViteConfig;
};

export type SSROptions = {
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
   * Note: key order follows object insertion order, which does not hold for integer-like keys -
   * a pattern starting with a numeric segment, eg. "2024/**",
   * is hoisted to the front by the JS engine and will match before any pattern written above it.
   * Prefix such patterns with "./" to keep them ordered as written, eg. "./2024/**".
   * The "./" is stripped when matching.
   * */
  renderMode?: "string" | "stream" | Record<string, "string" | "stream">;
};

export type TypeboxOptions = {
  /**
   * Optional map of custom messages to override default validation messages.
   * Allows to customize error text for i18n/l10n or project-specific wording.
   *
   * Values are format strings compatible with `node:util.format`,
   * allowing placeholders like `%s` or `%d` to interpolate parameters.
   *
   * @example
   * validationMessages: {
   *    STRING_MIN_LENGTH: "must be at least %d character%s long",
   *    NUMBER_MULTIPLE_OF: "must be a multiple of %s",
   * }
   * */
  validationMessages?: Partial<TypeboxValidationMessages>;

  /**
   * Path to a file whose **default export** should be a map of type references.
   * These references are used to extend or complement TypeBox schemas.
   *
   * Each exported type should extend `Type.Base` (or another TypeBox type)
   * and be instantiated in the default export object.
   *
   * @example
   * import Type from "typebox";
   *
   * class TDate extends Type.Base<Date> {
   *   // ... implementation ...
   * }
   *
   * export default {
   *   Date: new TDate(),
   * };
   *
   * */
  customTypesImport?: string;

  /**
   * Name to use for custom runtime validation refinements.
   * @default "VRefine"
   * */
  refineTypeName?: string;

  settings?: TypeboxSettings;
};

export type OpenAPIOptions = {
  outfile: string;
  openapi: `3.1.${number}`;
  info: {
    title: string;
    version: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      identifier?: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
};
