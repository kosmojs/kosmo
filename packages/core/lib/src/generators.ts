import type { Matcher } from "picomatch";
import picomatch from "picomatch";

import type {
  DefineGenerator,
  DefineGeneratorFactory,
  GeneratorCustomTemplates,
} from "@kosmojs/core";

export const defineGenerator: DefineGenerator = (f) => f as never;

export const defineGeneratorFactory: DefineGeneratorFactory = (f) => f;

export const createTemplateResolver = <T>(
  customTemplates: GeneratorCustomTemplates<T> | undefined,
  defaultTemplate: string,
) => {
  const templates: Array<[Matcher, string | Function]> = Object.entries({
    ...customTemplates,
  }).map(([pattern, template]) => [picomatch(pattern), template]);
  return (pattern: string, entry: T) => {
    const match = templates.find(([isMatch]) => isMatch(pattern));
    if (!match) {
      return defaultTemplate;
    }
    return typeof match[1] === "function" //
      ? match[1](entry)
      : match[1];
  };
};
