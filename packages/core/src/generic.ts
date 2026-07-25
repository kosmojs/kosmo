import picomatch, { type Matcher } from "picomatch";

import type { FetchApp, GeneratorCustomTemplates, NodeApp } from "./types";

export const querystringOptions: Partial<import("picoquery").Options> = {
  nestingSyntax: "index",
  arrayRepeat: true,
  arrayRepeatSyntax: "bracket",
};

export const isFetchApp = (app: FetchApp | NodeApp): app is FetchApp => {
  return typeof (app as FetchApp).fetch === "function";
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

export const createTemplateResolver = <T>(
  customTemplates: GeneratorCustomTemplates<T> | undefined,
  defaultTemplate: string,
) => {
  const resolver = createRouteResolver<string | Function | undefined>(
    customTemplates,
    undefined,
  );
  return (pattern: string, entry: T) => {
    const template = resolver(pattern);
    if (template === undefined) {
      return defaultTemplate;
    }
    return typeof template === "function" //
      ? template(entry)
      : template;
  };
};
