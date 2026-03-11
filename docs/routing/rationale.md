---
title: Directory-based nested routing
description: Understanding why directory-based routing scales better than file-based routing
    for organizing large applications with clear navigation, colocalization, and visual hierarchy.
head:
  - - meta
    - name: keywords
      content: directory routing benefits, file-based routing, routing comparison,
        scalability, code organization, folder structure, routing patterns
---

At first glance, directory-based routing looks more verbose than file-based alternatives.
`api/users/[id]/index.ts` vs `api/users/[id].ts` - the extra folder seems unnecessary.
It isn't, and the reason becomes obvious as your project grows.

## ⚠️ The File-Based Routing Problem

In file-based routing, route handlers and helper files live side by side:

```
api/
  users/
    index.ts           ➜ Handler for /users
    [id].ts            ➜ Handler for /users/:id
    schema.ts          ➜ Validation schemas... for which route?
    auth.ts            ➜ Authorization... for which endpoint?
    utils.ts           ➜ Helpers... used by what?
```

Which files are route handlers? Which are helpers? Is `schema.ts` a route at `/users/schema`
or a shared validation file? You can't tell without opening files or relying on team conventions.

## 🏆 Directory-Based Clarity

With directory-based routing, the rule is simple: **only `index.ts` is a route handler**.
Everything else in the folder is a helper for that route.

```
api/
  users/
    index.ts           ➜ Handler for /users
    schema.ts          ➜ Obviously a helper for /users

    [id]/
      index.ts         ➜ Handler for /users/:id
      permissions.ts   ➜ Obviously a helper for this endpoint

      posts/
        index.ts       ➜ Handler for /users/:id/posts
        formatter.ts   ➜ Obviously post-specific logic
```

No conventions to memorize, no ambiguity. The folder tree is your API map -
every folder with an `index.ts` is a route, everything else is support code.

This scales naturally:

```
api/
  products/
    index.ts
    [id]/
      index.ts
      cache.ts
      pricing.ts
      reviews/
        index.ts
        moderation.ts
        [reviewId]/
          index.ts
          flags.ts
```

Each route's complexity is isolated in its own folder.
New developers understand the structure immediately.
Six months later, you can still navigate it without re-reading the codebase.

## ⚖️ The Trade-off

You create a folder even when it only contains `index.ts`. That's the entire cost.

In return: zero ambiguity, natural colocalization, room to grow without restructuring,
and a folder tree that directly mirrors your API surface:

```sh
$ tree -d src/front/api
src/front/api/
└── shop
    ├── cart
    ├── [category]
    │   └── {productId}
    ├── checkout
    │   ├── confirm
    │   ├── payment
    │   └── shipping
    ├── orders
    │   └── [orderId]
    └── products
        └── {category}
```
