---
title: Generator User Options
description: Make generators configurable by defining options types
    that users can pass through Vite config for custom output paths, formats, and behavior.
head:
  - - meta
    - name: keywords
      content: generator options, plugin configuration, user config,
        generator settings, configurable generators, vite config
---

To make your generator configurable, define an options type
and pass it through the default function:

```ts
import { defineGenerator } from "@kosmojs/lib";

import { factory } from "./factory";

export type Options = {
  outfile: string;
  format?: "json" | "yaml";
  includeExamples?: boolean;
};

export default defineGenerator<Options, true>(
  (options) => {
    return (sourceFolder) => factory(sourceFolder, options);
  },
  {
    name: "MyGenerator",
    resolveTypes: true,
  },
);

```

Users configure your generator when adding it to their `kosmo.config.ts`:

```ts
import { defineConfig } from "@kosmojs/dev";
import myGenerator from "@my/generator";

export default defineConfig({
  generators: [
    myGenerator({
      outfile: "output.json",
      includeExamples: true,
    }),
  ],
});
```
