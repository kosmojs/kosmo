import type { PluginOption } from "vite";

import type { BACKENDS, FRONTENDS } from "../defaults";
import type {
  GeneratorCustomTemplates,
  GeneratorSignature,
} from "./generators";
import type { ViteConfig } from "./generic";
import type { ApiRoute, PageRoute } from "./routes";
import type { TypeboxSettings, TypeboxValidationMessages } from "./typebox";

type FrontendStack = keyof typeof FRONTENDS;
type BackendStack = keyof typeof BACKENDS;

export type VitestOptions<T = ApiRoute | PageRoute> = {
  /**
   * Seeding test files is enabled by default.
   *
   * Set `seed: false` to disable seeding and write test files by hand.
   * Or provide a map of patterns to seed only specific routes.
   *
   * NOTE: `name` and `path` are reserved keys;
   * if you need to use either one as a pattern, add a suffix:
   *  - "name/*"
   *  - "name/**"
   *
   * do not seed user routes:
   *   seed: {
   *     "user/**": false,
   *   }
   *
   * seed only user routes:
   *   seed: {
   *     "user/**": true,
   *     "**": false,
   *   }
   *
   * use custom template for user routes:
   *
   *   import * as templates from "./test/templates";
   *
   *   seed: {
   *     "user/**": templates.users,
   *   }
   * */
  seed:
    | boolean
    | {
        /**
         * By default seededtest files are named `index.test.ts`.
         * Use `name` option to name seeded files differently,
         * e.g. `name: "route.test.ts"` or `name: "route.spec.ts"`.
         * */
        name?: string;

        /**
         * By default test files are seeded and loaded from a path sibling to route file,
         * e.g.: `api/<route>/index.test.ts`.
         * Use path to seed into a different dir,
         * e.g. set `path: "test"` to seed into `test/api/<route>/index.test.ts`.
         * Relative to the source folder's root.
         * */
        path?: string;

        // Patterns to enable/disable testing per-route basis,
        // or to use custom seeding templates for select routes.
        [key: string]: boolean | string | ((r: T) => string);
      };

  // Custom Vite settings to use specifically for testing
  viteConfig?: ViteConfig;

  // Vitest generator to use instead of the default one.
  generator?: GeneratorSignature;
};

export type FrontendOptions = {
  stack: FrontendStack | { name: FrontendStack; plugin: PluginOption };
  base: string;
  ssr?: boolean | SSROptions | { generator?: GeneratorSignature };
  ssg?: boolean | { generator?: GeneratorSignature };
  tanstack?: { query?: boolean };
  test?: boolean | VitestOptions<PageRoute>;
  templates?: GeneratorCustomTemplates<PageRoute>;
  generator?: GeneratorSignature;
  viteConfig?: ViteConfig;
};

export type BackendOptions = {
  stack: BackendStack | { name: BackendStack };
  base: string;

  test?: boolean | VitestOptions<ApiRoute>;

  openapi?: OpenAPIOptions | { generator?: GeneratorSignature };

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
