<!-- #region hono -->
```ts
// Hono: api/env.d.ts
export declare module "_/api" {
  interface DefaultVariables {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultBindings {
    DB: D1Database;
  }
}
```
<!-- #endregion hono -->

<!-- #region h3 -->
```ts
// H3: api/env.d.ts
export declare module "_/api" {
  interface DefaultContext {
    permissions: Array<"read" | "write" | "admin">;
  }
}
```
<!-- #endregion h3 -->

<!-- #region koa -->
```ts
// Koa: api/env.d.ts
export declare module "_/api" {
  interface DefaultState {
    permissions: Array<"read" | "write" | "admin">;
  }
  interface DefaultContext {
    authorizedUser: User;
  }
}
```
<!-- #endregion koa -->
