---
title: Core Configuration Files
description: Configure global middleware in api/use.ts and extend global context
    and state types in api/env.d.ts for consistent TypeScript typing across all API endpoints.
head:
  - - meta
    - name: keywords
      content: global middleware, koa configuration, typescript declarations,
        DefaultContext, DefaultState, body parser, cors middleware, request logging
---

`KosmoJS` uses several core configuration files that affect all API endpoints.
Understanding these files helps you customize the behavior of your entire API surface.

## ⚙️ Global Middleware

The first file, `api/use.ts`, defines global middleware that applies to every API endpoint.

You can add your own global middleware here - things like request logging,
CORS headers, error handling, or any other cross-cutting concern that should apply universally.

Just remember that anything you add here runs for every request, so keep it efficient.

## 🔧 Default Context/State

The second file, `api/env.d.ts`, provides `TypeScript` type definitions
that extend default context and state objects:

::: code-group
```ts [Koa]
export declare module "_/front/api" {
  interface DefaultState {}
  interface DefaultContext {}
}
```
```ts [Hono]
export declare module "_/front/api" {
  interface DefaultVariables {}
  interface DefaultBindings {}
}
```
:::

These empty interfaces are your extension points.
When middleware adds properties to the context or state objects,
you declare those properties here to get proper type checking throughout your application.

Suppose you have authentication middleware that attaches a user object to the context.
You'd declare this in `env.d.ts`:

```ts [api/env.d.ts]
export declare module "_/front/api" {
  interface DefaultState {}
  interface DefaultContext {
    authorizedUser: User;
  }
}
```

Now every route handler knows about `ctx.authorizedUser`
and `TypeScript` will properly type-check your usage of it.

This is much more maintainable than redeclaring these types in every route file.

Similarly, if you store data in `ctx.state`, declare it through `DefaultState`:

```ts [api/env.d.ts]
export declare module "_/front/api" {
  interface DefaultState {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultContext {
    authorizedUser: User;
  }
}
```

Now every route handler knows about `ctx.state.permissions`
and `TypeScript` will properly type-check your usage of it.

These are Koa examples. For Hono, the approach is identical - extend `DefaultVariables`
and your properties will be available via `ctx.set()`, `ctx.get()`, and `ctx.var`.

**Important:** Don't forget to add global middleware that actually sets these properties.
Without the middleware, the properties you defined in `env.d.ts` won't be available in
your handlers.

This approach - declaring types once in a central location -
keeps your codebase DRY and ensures consistency across all your endpoints.
