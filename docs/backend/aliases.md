---
title: Route Aliases
description: Serve an existing API route at an additional public URL - well-known paths,
    legacy URLs, and public-facing names that differ from the route on disk.
head:
  - - meta
    - name: keywords
      content: route alias, api alias, legacy url, well-known url, feed.xml, url mapping,
        hono alias, h3 alias, koa alias
---

Route names come from the filesystem, which is what makes them predictable.

Occasionally a URL has to be something else: `/feed.xml` rather than `/rss`,
or a path a previous system published that you cannot break.

`alias` in the `backend` block serves an existing route at an additional URL:

```ts [kosmo.config.ts]
export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
    alias: {
      "/feed.xml": "rss",
      "/members/[id]": "users/[id]",
    },
  },
});
```

The key is the URL to serve. The value is the name of the route that handles it.

## The key is absolute

An alias URL is **not** prefixed by [backend.base](/essentials/config#backend-base-required).
It is the whole path, from the root of the host:

```ts
backend: {
  base: "/api",
  alias: {
    // served at /feed.xml, not /api/feed.xml
    "/feed.xml": "rss",
  },
}
```

That is the point of the feature - a well-known URL like `/feed.xml` or `/healthz`
usually has to sit outside the API prefix, where a filesystem route could not put it.

## Dynamic segments must match by name

When the alias carries parameters, the target route's parameters must all be present,
with the same names and the same kind. Their **positions may differ**:

```ts
alias: {
  // ok - same parameter, different surrounding path
  "/members/[id]": "users/[id]",

  // ok - same two parameters, reordered
  "/[org]/team/[id]": "orgs/[org]/members/[id]",

  // 404 - target expects "id", alias supplies "userId"
  "/members/[userId]": "users/[id]",

  // 404 - target expects a parameter the alias never supplies
  "/members": "users/[id]",
}
```

A mismatch is not a startup error. The alias is registered and the request 404s,
so check the shape when an alias silently fails to resolve.

## What the alias shares

An alias is another entry pointing at the same route - not a copy of it, and not a redirect.
No `3xx` is issued; the URL the client asked for is the URL it keeps.

The handler is the same function, so everything attached to the route comes with it:
its [middleware](/backend/middleware), the [cascading middleware](/backend/cascading-middleware)
of the directories above it, and its [runtime validation](/validation/intro).
There is nothing to duplicate and nothing that can drift between the two URLs.

## What it does not touch

Aliases are a server-side routing concern only.

The [fetch client](/fetch/intro) is keyed by the route's own name, so client code calls
`fetchClients["users/[id]"]` whichever URL the route also answers on.

The [OpenAPI spec](/openapi) documents the route once, under its route name.

Reach for an alias when an outside consumer needs a particular URL.
For an extra path your own frontend calls, a route file is simpler.

## Supported everywhere

`hono`, `h3` and `koa` all accept `alias`, and the semantics above are identical on each -
only the router pattern the alias compiles to differs.
