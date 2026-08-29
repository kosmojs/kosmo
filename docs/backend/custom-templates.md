---
title: Custom Route Templates
description: Override the generated defineRoute boilerplate for specific API routes using
    glob pattern matching. Scaffold consistent CRUD endpoints across many routes in Hono, H3 and Koa.
head:
  - - meta
    - name: keywords
      content: api route templates, defineRoute template, crud scaffolding, route patterns,
        glob matching, hono templates, h3 templates, koa templates, batch route generation
---

Every backend generator (`honoGenerator`, `h3Generator`, `koaGenerator`) accepts a `templates` option.
When you create a new route file whose name matches one of your patterns,
the generator writes **your** boilerplate into it instead of the built-in placeholder.

This is the backend half of the feature; pages have their own.
[Custom Page Templates&nbsp;›](/frontend/custom-templates)

## What It Overrides

Only the route file - the `index.ts` holding your `defineRoute` definition.

| File | Templatable? |
|---|:---:|
| `api/**/index.ts` - route definitions | ✅ |
| `api/**/use.ts` - cascading middleware | ❌ always the built-in |
| `api/app.ts`, `errors.ts`, `dev.ts`, `server.ts`, `env.d.ts` | ❌ deployed once at folder creation |

::: warning Templates only fill blank files
The generator writes boilerplate into a file **only when that file is empty**.
It never overwrites work you have already done -
which is also why changing a template does not retroactively rewrite existing routes.
To re-scaffold one, empty the file and let it be regenerated.
:::

## Configuration

Pass `templates` to your backend generator in the source folder's `kosmo.config.ts`,
keyed by route-name pattern:

```ts [kosmo.config.ts]
import { defineConfig, honoGenerator } from "@kosmojs/dev";

const crudTemplate = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => { /* list or read */ }),
  POST(async (ctx) => { /* create */ }),
  PUT(async (ctx) => { /* update */ }),
  DELETE(async (ctx) => { /* delete */ }),
]);`;

export default defineConfig({
  base: "/",
  generators: [
    honoGenerator({
      templates: {
        "admin/**": crudTemplate,
      },
    }),
  ],
});
```

Keys match the **route name** - the path relative to `api/`, without the trailing `index.ts`.
So `api/admin/users/index.ts` is matched as `admin/users`.

## Pattern Syntax

Patterns are [picomatch](https://github.com/micromatch/picomatch) globs matched against the route name.

### Single-depth wildcard (`*`)

```ts
{ "admin/*": template }
```

**Matches:** `admin/users`, `admin/settings`, `admin/[id]`
**Excludes:** `admin/users/roles` (too deep), `admin` (too shallow)

### Multi-depth wildcard (`**`)

```ts
{ "admin/**": template }
```

**Matches:** `admin/users`, `admin/users/roles`, `admin/[id]/audit` - any depth.

### Exact match

```ts
{ "health": template }
```

### Parameter segments are literal

Route parameters are escaped before matching, so `[id]`, `{id}` and `{...path}` mean
themselves rather than glob syntax:

```ts
{
  "users/[id]": userTemplate,           // required parameter
  "products/{category}": productTemplate, // optional parameter
  "docs/{...path}": docsTemplate,        // splat parameter
  "shop/[category]/{sub}": shopTemplate, // combined
}
```

## Resolution Priority

The **first matching pattern wins**, in the order the keys are written - so order them most specific first:

```ts
templates: {
  "admin/audit": auditTemplate,   // exact
  "admin/*": adminTemplate,       // one level
  "**": fallbackTemplate,         // everything else
}
```

A route matching nothing gets the generator's built-in placeholder.
Set `"**"` to replace that default everywhere.

::: warning Numeric-looking patterns jump the queue
JavaScript objects order integer-like keys first, regardless of where you wrote them - so
a pattern such as `"2024/**"` is hoisted to the front and matches before anything above
it. Prefix it with `./` to keep your written order: `"./2024/**"`.
The `./` is stripped before matching.

The same applies to [`renderMode`](/frontend/server-side-render#selecting-the-render-mode), which uses the same resolver.
:::

## Template Format

A template is either a **string**, or a **function** of the resolved route returning a string -
reach for the function form when the output depends on the route itself:

```ts
templates: {
  // plain string, rendered with Handlebars
  "admin/**": crudTemplate,

  // or computed from the route
  "reports/**": (route) => `
import { defineRoute } from "_/api";

// endpoint: ${route.name}
export default defineRoute<"${route.name}">(({ GET }) => [
  GET(async (ctx) => { /* ... */ }),
]);`,
}
```

String templates are rendered with Handlebars against a `{ route }` context,
so a <code v-pre>{{route.name}}</code> placeholder interpolates the route name -
which is what keeps the required [route-name type argument](/backend/intro#the-route-name-type-argument) correct in generated files.

### Per-backend shapes

Because the context API differs by backend, so does the boilerplate:

:::tabs key:backend variant:code
== Hono
```ts
const template = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    // Always \`return\` the response
    return ctx.json({ ok: true });
  }),
]);`;
```

== H3
```ts
const template = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (event) => {
    // return the value directly - objects serialize as JSON
    return { ok: true };
  }),
]);`;
```

== Koa
```ts
const template = `
import { defineRoute } from "_/api";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = { ok: true };
  }),
]);`;
```
:::

> Escape backticks (`` \` ``) and `${...}` inside template literals
that you do not want interpolated at config-evaluation time.

## Scaffolding CRUD Endpoints

This is where route templates earn their place. Standing up endpoints for a dozen
database tables means writing the same skeleton a dozen times -
validation targets, method handlers, error shape, all identical apart from the type.

Write it once:

```ts [kosmo.config.ts]
const resourceTemplate = `
import { defineRoute } from "_/api";
import type { Resource, ResourcePayload } from "./types";

export default defineRoute<"{{route.name}}">(({ GET, POST }) => [
  GET<{
    query: { page?: number; limit?: number },
    response: [200, "json", Array<Resource>],
  }>(async (ctx) => {
    // list
  }),

  POST<{
    json: ResourcePayload,
    response: [201, "json", Resource],
  }>(async (ctx) => {
    // create
  }),
]);`;

export default defineConfig({
  base: "/",
  generators: [
    honoGenerator({ templates: { "admin/**": resourceTemplate } }),
  ],
});
```

Then create the route folders. Each new `index.ts` arrives with the right structure - typed handlers, declared `response`
(so the [fetch client is typed](/fetch/type-safety#without-a-response-the-result-is-unknown) and OpenAPI picks it up),
ready to adapt instead of retyped.

Pair it with a colocated `types.ts` per route folder and the skeleton stays honest:
the template references `./types`, and each route defines its own.

## Common Use Cases

```ts
honoGenerator({
  templates: {
    "admin/**": crudTemplate,        // consistent admin endpoints
    "webhooks/**": webhookTemplate,  // signature verification + 200 fast
    "internal/**": internalTemplate, // runtimeValidation: false, trusted callers
  },
})
```
