import type { DefineGenerator, GeneratorMeta } from "./types";

export const GENERATOR_META = Symbol.for("KOSMO:GENERATOR_META");

/**
 * Define a generator with metadata stored internally.
 *
 * Metadata is attached to both the generator module and its instances,
 * accessible via `getGeneratorMeta()`
 *
 * **User-facing API:**
 * ```ts
 * import { defineConfig, ssrGenerator } from "@kosmojs/dev";
 *
 * export default defineConfig({
 *   generators: [ssrGenerator()], // Clean instantiation
 * });
 * ```
 *
 * **Internal dev plugin usage:**
 * ```ts
 * import { getGeneratorMeta } from "@kosmojs/lib";
 *
 * // Read module metadata before instantiation
 * const meta = getGeneratorMeta(ssrGenerator);
 * console.log(meta?.slot); // "ssr"
 *
 * // Read instance metadata after instantiation
 * for (const generator of config.generators) {
 *   const meta = getGeneratorMeta(generator);
 *   if (meta?.dependencies) {
 *     // Check/install dependencies
 *   }
 * }
 * ```
 *
 * @example Define a generator
 * ```ts
 * import { defineGenerator } from "@kosmojs/lib";
 *
 * export default defineGenerator(
 *   () => {
 *     return async (sourceFolder) => {
 *       // Generator logic
 *     };
 *   },
 *   {
 *     name: "Example",
 *     slot: "example",
 *     dependencies: {
 *       "some-package": "^1.0.0"
 *     }
 *   }
 * );
 * ```
 * */
export const defineGenerator: DefineGenerator = (
  factory: Function,
  meta?: GeneratorMeta,
) => {
  const value = meta ? deepFreeze(structuredClone(meta)) : undefined;

  const defineProperty = (fn: unknown) => {
    Object.defineProperty(fn, GENERATOR_META, {
      value,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    return fn;
  };

  return defineProperty((...args: unknown[]) => {
    return defineProperty(factory(...args));
  }) as never;
};

export const isGenerator = (fn: Function) => {
  return GENERATOR_META in fn;
};

export const getGeneratorMeta = (fn: Function) => {
  return (fn as never)[GENERATOR_META] as GeneratorMeta | undefined;
};

const deepFreeze = <T extends object>(obj: T) => {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const prop of Object.getOwnPropertyNames(obj)) {
      deepFreeze(obj[prop as never]);
    }
  }
  return obj;
};
