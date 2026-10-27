/**
 * Request dispatch rules, shared by every server that routes requests to source folders:
 * the dev server, `dist/run.js` and the SSR server.
 *
 * Keeping them in one place is what makes dev, preview and production agree
 * on which folder answers a given URL.
 *
 * WARN: keep this file isomorphic! it is exported from the package index,
 * which is loaded from both browser and server.
 * */

import { pathToRegexp } from "path-to-regexp";

/**
 * Whether a URL path falls under a base: the base itself, or anything below it.
 *
 *   matchBase("/admin", "/admin")       -> true
 *   matchBase("/admin", "/admin/users") -> true
 *   matchBase("/admin", "/administer")  -> false
 *   matchBase("/", "/anything")         -> true
 * */
export const matchBase = (base: string, pathname: string): boolean => {
  if (pathname === base) {
    return true;
  }
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return pathname.startsWith(prefix);
};

/**
 * Specificity of a base, used to try longer bases before the ones they are nested in.
 *
 * Length alone already puts a base before any shorter base it is nested in;
 * the segment count only breaks ties between unrelated bases of the same length.
 *
 *   /admin/api -> 10 + 2
 *   /admin     -> 6  + 1
 *   /api       -> 4  + 1
 *   /          -> 1  + 0
 * */
export const baseWeight = (base: string): number => {
  return base.length + base.split("/").filter(Boolean).length;
};

/**
 * Returns a copy of the entries, most specific base first.
 * */
export const sortByBase = <T>(
  entries: ReadonlyArray<T>,
  baseOf: (entry: T) => string,
): Array<T> => {
  return [...entries].sort(
    (a, b) => baseWeight(baseOf(b)) - baseWeight(baseOf(a)),
  );
};

/**
 * Compiles alias patterns (path-to-regexp syntax) into regular expressions.
 * Aliases are absolute URLs, so a missing leading slash is added.
 * */
export const compileAliasPatterns = (
  patterns: ReadonlyArray<string> | undefined,
): Array<RegExp> => {
  return (patterns || []).map((pattern) => {
    return pathToRegexp(`/${pattern}`.replace(/\/{2,}/g, "/")).regexp;
  });
};

export type DispatchEntry<T> = {
  base: string;
  aliasPatterns?: ReadonlyArray<RegExp> | undefined;
  target: T;
};

/**
 * Picks the entry that answers a URL path.
 *
 * Aliases are tried first, across all entries:
 * an alias names an exact URL, so it wins over any base prefix,
 * including a longer base that belongs to another folder.
 *
 * Then bases are tried, most specific first.
 * */
export const createDispatcher = <T>(
  entries: ReadonlyArray<DispatchEntry<T>>,
): ((pathname: string) => T | undefined) => {
  const byBase = sortByBase(entries, (entry) => entry.base);

  return (pathname) => {
    for (const { aliasPatterns, target } of entries) {
      if (aliasPatterns?.some((pattern) => pattern.test(pathname))) {
        return target;
      }
    }
    for (const { base, target } of byBase) {
      if (matchBase(base, pathname)) {
        return target;
      }
    }
    return undefined;
  };
};
