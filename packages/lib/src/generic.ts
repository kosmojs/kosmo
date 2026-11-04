import { posix } from "node:path";

import picomatch, { type Matcher } from "picomatch";
import { mergeConfig, type UserConfig } from "vite";

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PREVIEW_HOST,
  DEFAULT_PREVIEW_PORT,
  defaults,
  type GeneratorCustomTemplateFunction,
  type GeneratorCustomTemplates,
  type KosmoSettings,
  type ResolvedEntry,
} from "@kosmojs/core";

export const mergeConfigs = (
  ...configs: Array<UserConfig | undefined>
): UserConfig => {
  return [{ configFile: false }, ...configs].reduce<UserConfig>(
    (config, prev) => mergeConfig(config || {}, prev || {}),
    {},
  );
};

export const escapeTemplateLiterals = (origin: string) => {
  return [
    // Escape backticks for safe use in template literals
    [/(?<!\\)`/g, "\\`"],
    // Escape $ for safe use in template literals
    [/(?<!\\)\$\{/g, "\\${"],
  ].reduce((text, [a, b]) => text.replace(a, b as never), origin);
};

export const containsPathTraversalPatterns = (str: string): boolean => {
  return [
    // path traversal patterns
    /\.\.\//,
    /\/\.\//,
  ].some((e) => e.test(str));
};

export const configFilePattern = (folder: string) => {
  return posix.join(defaults.srcDir, folder, "kosmo.config.ts");
};

export const resolveHostAddress = (
  settings: KosmoSettings | undefined,
  key: "devHost" | "previewHost",
) => {
  let [host, port] =
    key === "devHost"
      ? [DEFAULT_HOST, DEFAULT_PORT]
      : [DEFAULT_PREVIEW_HOST, DEFAULT_PREVIEW_PORT];
  if (settings?.[key]) {
    const url = new URL(`http://${settings[key]}`);
    if (url.hostname) {
      host = url.hostname;
    }
    if (url.port) {
      port = Number(url.port);
    }
  }
  return [host, port].join(":");
};

// Route names contain literal [param] / {param} segments, which picomatch would
// otherwise read as character classes / brace expansion.
// Escape them so only * and ** act as wildcards; route paths are matched raw.
export const escapeRouteLiterals = (pattern: string) => {
  return pattern.replace(/[[\]{}]/g, "\\$&");
};

export const createRouteResolver = <T>(
  patterns: Record<string, T> | undefined,
  defaultValue: T,
) => {
  const resolvers: Array<[Matcher, T]> = Object.entries({ ...patterns }).map(
    ([pattern, value]) => [
      picomatch(escapeRouteLiterals(pattern), { dot: true }),
      value as T,
    ],
  );
  return (route: string): T => {
    const match = resolvers.find(([isMatch]) => isMatch(route));
    return match //
      ? match[1]
      : defaultValue;
  };
};

/**
 * Builds the resolver generators use to pick a custom template
 * for an entry they are about to seed, from the folder's `templates` option.
 *
 * Patterns are glob patterns matched against the entry name,
 * the route path as written on disk, e.g. `admin/users/[id]`.
 * Only `*` and `**` act as wildcards: the brackets and braces of param segments
 * are matched literally, and `admin/**` matches `admin` itself as well.
 * Patterns are tried in insertion order and the first match wins,
 * so list specific patterns before the globs that would also cover them.
 *
 * What a matched template seeds depends on its type:
 *
 * - a string seeds route files only, `pageRoute` and `apiRoute`;
 * for layouts and use.ts files it resolves to undefined,
 * so the generator keeps its built-in template there
 * - a function is called for every kind - routes and layouts on the frontend,
 * routes and use.ts files on the backend - with the resolved entry, `{ kind, entry }`.
 * It returns the template, or undefined to keep the built-in one,
 * so a single pattern can seed a page and its layout consistently
 *
 * The resolver returns an object keyed by the entry's kind,
 * holding the custom template or undefined:
 *
 *   const customTemplate = templateResolver(entry.name, resolvedEntry)[kind];
 *
 * Callers fall back to their built-in template on undefined.
 * */
export const createTemplateResolver = (
  customTemplates: GeneratorCustomTemplates | undefined,
) => {
  const resolver = createRouteResolver<
    string | GeneratorCustomTemplateFunction | undefined
  >(customTemplates, undefined);

  return (
    pattern: string,
    entry: ResolvedEntry,
  ): Partial<Record<ResolvedEntry["kind"], string | undefined>> => {
    const template = resolver(pattern);
    return {
      [entry.kind]:
        template === undefined
          ? undefined
          : typeof template === "function"
            ? template(entry)
            : ["pageRoute", "apiRoute"].includes(entry.kind)
              ? template
              : undefined,
    };
  };
};
