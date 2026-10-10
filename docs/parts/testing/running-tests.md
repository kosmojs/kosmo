A `test` script added to `package.json`, run it using your package manager:

:::tabs key:pm variant:code
== npm
~~~sh
npm run test
~~~

== pnpm
~~~sh
pnpm test
~~~

== yarn
~~~sh
yarn test
~~~
:::

Vitest accepts path filters, so you can narrow a run to one source folder,
<span class="text-nowrap">one side of it</span>, <span class="text-nowrap">or a single route</span>:

~~~sh
pnpm test <folder>                 # only the given source folder
pnpm test <folder>/api             # only backend routes in that folder
pnpm test <folder>/api/<route>     # only the given backend route
pnpm test <folder>/pages           # only frontend routes in that folder
pnpm test <folder>/pages/<route>   # only the given frontend route
~~~

:::info Worth Noting
Patterns above works with default [seed.path](#name-and-path) option.
If you set a custom `path`, make sure to include it in the pattern.
E.g.: setting `path: "test"` means the patterns should look like: `<folder>/test/api` and `<folder>/test/pages`.
:::

### Vitest config

Source folders with testing enabled are loaded as projects into `vitest.config.ts`.

Test files are matched by the `seed.name` and `seed.path` each source folder declares in its [own&nbsp;config](#name-and-path) -
`index.test.ts` beside each route, under `api/` or `pages/`, unless you say otherwise.

~~~ts [vitest.config.ts]
import { defineConfig, mergeConfig } from "vitest/config";

import { loadConfig } from "@kosmojs/vitest";

export default defineConfig(
  mergeConfig(
    {
      // your config here
    },
    await loadConfig(import.meta.dirname),
  ),
);
~~~

The file is yours to configure: add more tests, settings, and so on,
just do not remove `loadConfig()`, as that would exclude source folders from the test harness.
