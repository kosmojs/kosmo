---
title: Writing Custom Generators
description: Create custom KosmoJS generators to produce code based on route structure and types.
    Learn generator architecture, and the GeneratorConstructor structure.
head:
  - - meta
    - name: keywords
      content: custom generators, vite plugin development, generator api,
        code generation, plugin architecture, GeneratorConstructor
---

Generators aimed at producing code based on your route structure and types.

While `KosmoJS` provides built-in generators for common needs,
you can create custom generators tailored to your specific requirements.

## Understanding the Architecture

At the core, the dev server watches `api/` and `pages/` directories
and sends resolved route entries to all registered generators.

Generators receive route information and generate files accordingly -
type definitions, helper functions, documentation, or anything else
your project needs.

## Generator Structure

A generator is a module that exports a default function
returning a `GeneratorConstructor` object:

```ts
import { defineGenerator } from "@kosmojs/lib";
import { factory } from "./factory";

export default defineGenerator(() => factory, {
  name: "MyGenerator",
});
```

Second argument used to define metadata for given generator.
The only required prop is `name`. Here is the signature:

```ts
export type GeneratorMeta = {
  name: string;

  /*
   * Used on core built-in generators to distinguish them from user-defined ones.
   * api/fetch generators always run first, ssr always run last.
   * User generators run in the order they were added.
   * */
  slot?: "api" | "fetch" | "ssr";

  /**
   * Package dependencies required by this generator.
   * The dev plugin checks installation status before running.
   * */
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;

  /**
   * Enables type resolution for generators that require fully resolved type information.
   *
   * When `true`, types are resolved to their flattened representations before
   * generator execution, making complete type data available.
   * */
  resolveTypes?: boolean;
};
```
