Seeding test files is enabled by default, so `test: true` is shorthand for `{ seed: true }`.
Seeding writes a starter `index.test.ts` file beside each route.

Set `seed: false` to disable seeding and write test files by hand.

~~~ts [Enable testing but do not seed test files]
export default defineConfig({
  backend: { // or frontend
    test: { // [!code focus:3]
      seed: false,
    },
  },
});
~~~

Alternatively, provide a map of patterns to seed only specific routes:

~~~ts
export default defineConfig({
  backend: { // or frontend
    test: { // [!code focus:6]
      seed: {
        // do not seed user routes
        "user/**": false,
      },
    },
  },
});
~~~

~~~ts
export default defineConfig({
  backend: { // or frontend
    test: { // [!code focus:7]
      seed: {
        // seed only user routes
        "user/**": true,
        "**": false,
      },
    },
  },
});
~~~

Also it is possible to use custom templates for seeding by provided a string for value:

~~~ts
import * as templates from "~/test/templates"; // [!code focus]

export default defineConfig({
  backend: { // or frontend
    test: { // [!code focus:6]
      seed: {
        // use a custom template for user routes
        "user/**": templates.users,
      },
    },
  },
});
~~~

### `name` and `path`

Two keys inside `seed` are reserved: `name` and `path`.
They control the shape and location of every seeded file.

> Because `seed.name` and `seed.path` are reserved, neither can be used as a pattern key directly.
> <span class="text-nowrap">To match routes by those names</span>, add a suffix - `"name/*"` or `"name/**"`.

`seed.name` is the seeded file name. By default it is `index.test.ts`, written beside the route it belongs to.
Set `seed.name` to change it - `name: "route.spec.ts"`, for instance, seeds every test file under that name.

`seed.path` is where seeded files land. The default is `api/` on backend and `pages/` on frontend,
which keeps each test file beside its route.

Set `seed.path` to seed them somewhere else. E.g.: `path: "test"` on backend places files in `test/api/<route-name>/`,
and the same option on frontend places them in `test/pages/<route-name>`.

:::info Worth Noting
Changing `seed.name` or `seed.path` after test files have already been seeded does not rename or move the existing files.
They stay where they are, under their original names, and the harness no longer picks them up, since it now looks at the new name/path.
:::
