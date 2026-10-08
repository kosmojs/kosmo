
After you enable testing for a source folder, restart the dev server;
it will bring in new dependencies and seed a `vitest.config.ts` file at the project root.

Dependencies are added to `package.json` automatically, just install them using your package manager.

Then you can run `vitest` directly or through package manager:

:::tabs key:pm variant:code
== npm
~~~sh
npx vitest  # or `npm exec vitest`
~~~

== pnpm
~~~sh
pnpm vitest
~~~

== yarn
~~~sh
yarn exec vitest
~~~
:::

Vitest accepts path filters, so you can narrow a run to one source folder,
<span class="text-nowrap">one side of it</span>, <span class="text-nowrap">or a single route</span>:

~~~sh
pnpm vitest <folder>                 # only the given source folder
pnpm vitest <folder>/api             # only backend routes in that folder
pnpm vitest <folder>/api/<route>     # only the given backend route
pnpm vitest <folder>/pages           # only frontend routes in that folder
pnpm vitest <folder>/pages/<route>   # only the given frontend route
~~~

:::info Worth Noting
Patterns above works with default [seed.path](#name-and-path) option.
If you set a custom `path`, make sure to include it in the pattern.
E.g.: setting `path: "test"` means the patterns should look like: `<folder>/test/api` and `<folder>/test/pages`.
:::

To make this easier, add a script to `package.json`:

~~~json
{
  "scripts": {
    "test": "vitest"
  }
}
~~~

Then `pnpm test` - or `pnpm test <pattern>` - runs the suite with no extra ceremony.

### Vitest config

Source folders with testing enabled are loaded as projects into `vitest.config.ts`.

> Test files are matched by the `name` and `path` each source folder declares in its [own&nbsp;config](#name-and-path) -
> `index.test.ts` beside each route, under `api/` or `pages/`, unless you say otherwise.

~~~ts [vitest.config.ts]
import { defineConfig, mergeConfig } from "vitest/config";

import { loadConfig } from "@kosmojs/vitest";

export default defineConfig(
  mergeConfig(
    {
      // your config here
    },
    await loadConfig(),
  ),
);
~~~

The file is yours to configure: add more tests, settings, and so on,
just do not remove `loadConfig()`, as that would exclude source folders from the test harness.
