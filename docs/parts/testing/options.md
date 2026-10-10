:::tabs variant:code
== TestOption
~~~ts
export type TestOption = boolean | {
  seed: boolean | {
    // Seed file name; default: index.test.ts
    name?: string;
    // Seed path; default: "api" on backend, "pages" on frontend
    path?: string;
    // Patterns to enable or disable testing on a per-route basis,
    // or to use custom seeding templates for select routes.
    [key: string]: boolean | string | ((r: RouteEntry) => string);
  };

  // Custom Vite settings to use specifically for testing
  viteConfig?: ViteConfig;
};
~~~
==

== RouteEntry
~~~ts
export type RouteEntry = {
  // Unique ID across all routes, safe to use as a JavaScript identifier
  id: string;
  // Route name, e.g. "account/[id]"
  name: string;
  // Root folder route defined in; either "api" or "pages"
  folder: string;
  // Path to route file, relative to route folder
  file: string;
};
~~~
==
:::
