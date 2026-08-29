---
title: Dynamic Route Parameters
description: Handle dynamic URL segments with required [id], optional {id} and splat {...path} parameters.
    SolidStart-inspired syntax that works identically for API routes and client pages.
head:
  - - meta
    - name: keywords
      content: route parameters, dynamic routes, url parameters, required parameters,
        optional parameters, splat parameters, bracket notation, path segments
---

Parameter types supported out of the box, with same syntax for both API and client pages:

| Syntax      | Type     | Matches                |
|-------------|----------|------------------------|
| `[id]`      | Required | Exactly one segment    |
| `{id}`      | Optional | One segment or nothing |
| `{...path}` | Splat    | Any number of segments |

## Required Parameters

```
users/[id]/index.ts   ➜ /users/123, /users/abc
```

The parameter name becomes the key in `ctx.validated.params` (or your framework's equivalent).
`[id]` gives you `params.id`, `[userId]` gives you `params.userId`.

## Optional Parameters

```
users/{id}/index.ts   ➜ /users and /users/123
```

Useful for combining list and detail views in a single handler,
branching on whether the parameter is present.

**Important:** optional parameters must not be followed by required parameters.

```
users/{section}/{subsection}  ✅
users/{optional}/[required]   ❌
```

### Watch Out for Ambiguous Paths

Optional parameters followed by static segments can cause unexpected 404s:

```
properties/{city}/filters/index.tsx
```

Visiting `/properties/filters`: the router matches `{city}` = `"filters"`,
then expects another `/filters` segment - which isn't there. Result: 404.

Fix it by adding an explicit static route:

```
properties/
├── filters/index.tsx          ➜ /properties/filters
└── {city}/
    └── filters/index.tsx      ➜ /properties/NY/filters
```

Static routes always take priority over dynamic ones.

### Required vs Optional - a Subtlety

`[id]` technically means "required at this URL position", but a sibling `index` file changes that:

```
careers/
├── index.tsx       ➜ /careers (fallback when no id)
└── [jobId]/
    └── index.tsx   ➜ /careers/123
```

When a parent `index` exists, `[jobId]` is effectively optional - there's a fallback to render.
In this case, `{jobId}` communicates intent more clearly and both notations work identically.

## Splat Parameters

```
docs/{...path}/index.ts   ➜ /docs/getting-started
                          ➜ /docs/api/reference
                          ➜ /docs/guides/deployment/production
```

The matched segments are provided as an array - useful for doc sites, file browsers,
or anything with arbitrarily nested paths.

A request to `/docs/guides/deployment/production` gives you
`params.path` as `["guides", "deployment", "production"]`.

## Mixed Segments

Segments can combine static text with parameters:

```
products/[category].html      ➜ /products/electronics.html
profiles/[id]-[data].json     ➜ /profiles/1-posts.json
files/[name].[ext]            ➜ /files/document.pdf
```

Mixed segments support varies by framework:

- **Hono/H3** - partial support, with caveats
- **Koa** - full support
- **Vue, Svelte and MDX** - full support
- **React Router** - `.ext` suffix only
- **SolidJS Router** - not supported

Prefer simple segments for frontend routes.
[Full support matrix ›](/essentials/frameworks#routing-syntax-support)

## Power Syntax

For advanced cases, `KosmoJS` passes `path-to-regexp v8` patterns through directly.

> **The rule:** if the param name contains non-alphanumeric characters,
it is treated as a raw pattern.

This unlocks things like optional static parts:

```
products/{:category.html}
```
- `/products` ✅ (no category, no `.html`)
- `/products/electronics.html` ✅
- `/products/electronics` ❌ (`.html` required when category is present)

More examples:

```
book{-:id}-info           ➜ /book-info or /book-123-info
locale{-:lang{-:country}} ➜ /locale, /locale-en, /locale-en-US
api/{v:version}/users     ➜ /api/users or /api/v2/users
```

::: info Limited support across frameworks
Power Syntax fully works with Koa routes only. Hono will match that routes
but params will be registered using positional index + a hash, e.g. `_0abc` or `_1xyz`.
H3 wont match any of these routes. For client pages use simple segments instead.
:::
