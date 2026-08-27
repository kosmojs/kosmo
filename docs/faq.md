---
title: KosmoJS FAQ
description: Frequently asked questions about KosmoJS for developers and LLM agents
outline: [2, 3]
---

**KosmoJS FAQ**

### Getting Started & Project Setup

#### What is KosmoJS and what problem does it solve?
A composable meta-framework for organizing multiple apps in a scalable project.

It avoids the friction of microservices (drifting shared types, separate CI/deploy),
monorepos (workspace/package/build-cache overhead and a `packages/shared` dumping ground),
and DIY glue (hand-rolled scripts that become load-bearing).

Instead it uses a Vite-inspired "source folders" approach: the structure of a monorepo,
the simplicity of a single project, and the independence of separate apps -
without the overhead of any of them.

You keep control of backend, frontend, state, styling, database, and deploy target;
KosmoJS owns routing conventions, the validation pipeline, middleware composition,
dev workflow, and build orchestration.
[Details&nbsp;›](/about)

#### Is KosmoJS a runtime, a bundler, or a framework?
Rather a meta-framework built on top of Vite. There is no proprietary runtime, no custom bundler,
and no framework lock-in - every layer (Vite, Hono/H3/Koa, React/Vue/Solid/Svelte/MDX)
is a tool you can use, debug, and replace independently.
[Details&nbsp;›](/about)

#### How do I create a new KosmoJS project?
Run `npm create kosmo app` (or `pnpm create kosmo app` / `yarn create kosmo app`).
An interactive setup creates the project together with your first source folder.
Then `cd ./app` and install dependencies.

Use `.` as the name to scaffold into the current folder (e.g. a freshly cloned repo).
[Details&nbsp;›](/start)

#### How do I create a project non-interactively?
Pass the source folder options up front - when flags are present no prompts appear:
`npm create kosmo app -- --folder main --base / --framework react --backend hono`
(pnpm and yarn forward flags without the extra `--`: `pnpm create kosmo app --folder ...`).

Required flags: `--folder`, `--base`.

Optional flags: `--framework`, `--backend`, `--ssr`, `--tsq`, `--overwrite`.

Use `.` as the name to scaffold into the current folder: `npm create kosmo . -- --folder ...`
[Details&nbsp;›](/start)

#### How do I add a source folder?
Run `npm run folder` (or `pnpm folder` / `yarn folder`).
[Details&nbsp;›](/tutorial#add-more-source-folders)

#### What am I prompted for when adding a source folder?
Folder name, base URL, framework, backend, and SSR.
Non-interactive flags: `--name`, `--base`, `--framework solid|react|vue|svelte|mdx`, `--backend hono|h3|koa`, `--ssr`, `--tsq`.
[Details&nbsp;›](/tutorial#add-more-source-folders)

#### How do I create a backend-only (API) folder, or a frontend-only folder?
A source folder doesn't have to ship both sides - framework and backend are independent, and each is optional.
In interactive mode, choose `None (API-only folder)` in the framework select,
or `None (client-only folder)` in the backend select.

In non-interactive mode there is no `none` value to pass - simply omit the flag:

```sh
pnpm folder --name api --base / --backend hono        # backend-only, no UI
pnpm folder --name docs --base /docs --framework mdx  # frontend-only, no backend
```

The generated `kosmo.config.ts` contains only the generators that side needs.
[Details&nbsp;›](/tutorial#add-more-source-folders)

#### Can I create a project without a source folder?
Yes - in non-interactive mode omit `--folder` and only the project shell is created;
add folders later with `npm run folder`. The interactive setup always walks you
through creating the first folder - a project needs at least one to do anything.
[Details&nbsp;›](/start)

#### Why install again after adding a source folder?
Adding a folder pulls in framework-specific dependencies that need to be installed.
[Details&nbsp;›](/start)

#### How do I start the dev server and what's the default port?
`pnpm dev` (all folders) or `pnpm dev front` (one folder). Default port is `4556`.
[Details&nbsp;›](/backend/development-workflow#starting-the-dev-server)

#### How do I change the dev port?
It's the `devPort` value in `package.json`.
[Details&nbsp;›](/backend/development-workflow#starting-the-dev-server)

#### How does this compare to Next.js / Nuxt / SolidStart / tRPC / a hand-rolled Vite setup?
Unlike Next/Nuxt/SolidStart it doesn't choose your frontend or own your deploy model;
unlike tRPC it's route-based (not procedure-based) and also generates OpenAPI and runtime validators;
unlike a hand-rolled Vite setup it provides directory routing for both sides,
generated validation/clients, an isomorphic fetch client (in-process on the server
during SSR, no network hop), out-of-the-box SSR with an opt-in streaming render mode,
and multi-folder build orchestration without the DIY glue.
[Details&nbsp;›](/features)

### Source Folders

#### What is a source folder?
A self-contained app inside the project with its own framework stack, base URL,
routing, middleware, layouts, config, and build output -
but sharing one `package.json`, one `node_modules`, one database layer, and one set of types.
Example layout:
- `src/app` (React + Hono, base `/`)
- `src/admin` (Vue + H3, base `/admin`)
- `src/marketing` (MDX, no backend, base `/`)

[Details&nbsp;›](/features)

#### How is this different from a monorepo package / microservices / DIY glue?
Folders are not separate packages: no workspaces, no package boundaries,
no internal dependency graph, no publishing, no versioning, no workspace protocols.
You get monorepo-like structure and microservice-like independence with single-project simplicity.
[Details&nbsp;›](/about)

#### Can different folders use different frameworks/backends at the same time?
Yes. Each folder picks its own backend (Hono/H3/Koa) and frontend (React/Vue/SolidJS/Svelte/MDX),
and they coexist in one project.
[Details&nbsp;›](/features)

#### How do folders share types without publishing/versioning?
Import a type directly across folders through the reserved aliases - `@/*` for root-level
imports, `~/*` for source-folder imports, `_/*` for generated code. Change a database model
and every folder sees it immediately. No publishing, no workspace protocols.
[Details&nbsp;›](/frontend/intro#multi-folder-architecture)

#### Can I build/deploy a single folder?
Yes - `pnpm build front` builds just that folder. Folders develop together as one project,
but can be built all at once or one at a time, and each build is a self-contained entity you
can deploy independently.
[Details&nbsp;›](/backend/building-for-production)

#### How do I run/build all folders vs one?
`pnpm dev` / `pnpm build` for all; append a folder name (`pnpm dev front`, `pnpm build admin`) for one.
[Details&nbsp;›](/backend/development-workflow#starting-the-dev-server)

#### Do routes/types leak between folders?
No - generated types and utilities are scoped per folder.
The admin dashboard's navigation types won't include the main app's routes, and vice versa.
[Details&nbsp;›](/frontend/intro#multi-folder-architecture)

#### When should I split into separate folders?
One folder per distinct concern (main app, admin, marketing).
A useful rule for SSR vs CSR: deploy an SSR folder for marketing content
and a CSR folder for the app rather than mixing SSR/CSR within one folder.
[Details&nbsp;›](/frontend/server-side-render#technical-considerations)

### Directory-Based Routing

#### How does routing map files to URLs?
Folder names become path segments; `index` files define the endpoint or component:
- `api/users/[id]/index.ts` maps to `/api/users/:id`
- `pages/users/[id]/index.tsx` maps to `/users/:id`.

No separate routing config - your file structure is your route definition.
[Details&nbsp;›](/routing/intro#how-it-works)

#### Why directory-based instead of file-based?
Clarity at scale: only `index.ts` is a route handler; every other file in the folder
is an obviously-colocated helper. File-based routing leaves `schema.ts`/`auth.ts`/`utils.ts` ambiguous -
route or helper? Directory-based removes that ambiguity.
The only cost is creating a folder even when it holds just `index.ts`.
[Details&nbsp;›](/routing/rationale)

#### Why must every route be a folder with an `index` file, even the root?
Consistency - no special cases. The base route uses a folder named `index`
(`pages/index/index.tsx` -> `/`).
[Details&nbsp;›](/routing/intro#how-it-works)

#### How do nested routes work?
Nest folders. `api/users/[id]/posts/index.ts` -> `/api/users/:id/posts`,
as deep as your domain requires, each level colocating its own helpers, types,
and tests without affecting siblings. Nesting also composes vertically: layouts wrap
nested pages, and middleware cascades down the tree, so a parent segment's layout and
middleware apply to everything beneath it.
[Details&nbsp;›](/routing/intro#nested-routes)

#### Why the parallel `api/` and `pages/` structure?
Intentional - a page and its corresponding API endpoint are always one folder apart and easy to find.
[Details&nbsp;›](/routing/intro#how-it-works)

#### How do I create an API route?
Create a folder under `api/` with an `index.ts` file - the folder path becomes the URL
and KosmoJS generates starter code automatically. For example, `api/products/index.ts`
exposes `/api/products`, and `api/products/[id]/index.ts` exposes `/api/products/:id`.
Inside, default-export a `defineRoute` that returns method handlers,
then replace the generated placeholder with real logic and visit the URL
(e.g. `http://localhost:4556/api/products`).
[Details&nbsp;›](/routing/intro#route-file-requirements)

#### How do I create a page?
Create a matching folder under `pages/` with an `index` component file for your framework -
`pages/products/index.tsx` (React/SolidJS), `.vue` (Vue), `.svelte` (Svelte), or `.mdx` (MDX) - and it becomes `/products`.
KosmoJS generates a placeholder component you replace with your own;
the parallel `api/` and `pages/` trees mean a page and its endpoint are always one folder apart.
The two sides are coupled by usage, not by name - you pick the names on each end freely. The
docs mirror api and page names purely for consistency; matching them is a convention, not a
requirement.
Pages typically read data through the generated fetch client (`fetchClients["products"].GET()`).
[Details&nbsp;›](/routing/intro#route-file-requirements)

#### What does the `_/` prefix and `_/api` map to?
`_/` maps to `lib/` (generated code). `_/api` resolves to `lib/<folder>/api.ts`,
where `<folder>` is your source-folder name.
[Details&nbsp;›](/routing/generated-content#api-routes)

#### What do `@/*`, `~/*`, `_/*` mean?

Reserved path mappings:
- `@/*` root-level imports
- `~/*` source-folder imports,
- `_/*` generated-code imports.

Don't reuse these prefixes for your own aliases.
[Details&nbsp;›](/tutorial)

### Route Parameters

#### What are the three parameter types?

- `[id]` required (exactly one segment)
- `{id}` optional (one segment or nothing)
- `{...path}` splat (any number of segments).

Same syntax for API routes and pages.
[Details&nbsp;›](/routing/params)

#### How do I read a splat parameter?
Matched segments come back as an array - for `/docs/guides/deployment/production`,
`ctx.validated.params.path` is `["guides", "deployment", "production"]`.
Useful for doc sites, file browsers, arbitrarily nested paths.
[Details&nbsp;›](/routing/params#splat-parameters)

#### Why can't an optional param precede a required one?
It creates ambiguity; `users/{optional}/[required]` is invalid.
Optional params must not be followed by required ones (`users/{section}/{subsection}` is fine).
[Details&nbsp;›](/routing/params#optional-parameters)

#### Why am I getting an unexpected 404 with an optional param before a static segment?
With `properties/{city}/filters`, visiting `/properties/filters` makes the router match
`{city}="filters"` and then expect another `/filters` segment that isn't there - 404.
Fix it by adding an explicit static route (`properties/filters/index.tsx`), which takes priority.
[Details&nbsp;›](/routing/params#watch-out-for-ambiguous-paths)

#### When does a static route win over a dynamic one?
Always - static routes take priority over dynamic ones.
[Details&nbsp;›](/routing/params#watch-out-for-ambiguous-paths)

#### How does a sibling `index` make `[id]` effectively optional?
A parent `index` provides a fallback to render, so `careers/index.tsx` + `careers/[jobId]/index.tsx`
makes `[jobId]` effectively optional. `{jobId}` communicates that intent more clearly;
both notations work identically here.
[Details&nbsp;›](/routing/params#required-vs-optional-a-subtlety)

#### How do mixed segments work?
Static text + params in one segment: `[category].html`, `[id]-[data].json`, `[name].[ext]`.
The folder is named with the mixed segment and `index.ts` lives inside it like any other route.
[Details&nbsp;›](/routing/params#mixed-segments)

#### Which frontends support mixed segments?
- *Backend*
    - Hono and H3: partial support with caveats.
    - Koa: full support.
- *Frontend*:
    - Vue, Svelte, and MDX: full support.
    - React Router: `.ext` suffix only.
    - SolidJS: not supported.

Prefer simple segments for frontend routes and keep mixed segments to the API side where support is complete.
[Details&nbsp;›](/routing/params#mixed-segments)

#### What is power syntax?
Raw `path-to-regexp v8` patterns passed through directly.
The rule: any param name containing non-alphanumeric characters is treated as a raw pattern.
Examples: `book{-:id}-info`, `locale{-:lang{-:country}}`, `api/{v:version}/users`.
Read the path-to-regexp docs before using it in production.
[Details&nbsp;›](/routing/params#power-syntax)

#### How do I make an optional static part (e.g. an optional `.html`)?
e.g. `products/{:category.html}` - matches `/products` and `/products/electronics.html`
but not `/products/electronics`.
[Details&nbsp;›](/routing/params#power-syntax)

#### Does KosmoJS run its own path-to-regexp routing under the hood?
No - path-to-regexp is used only at build time to parse your directory structure into route definitions.
At runtime, those parsed routes are registered with each framework's native router
exactly as you would register them by hand, so you keep the framework's full native routing:
Hono's high-performance router on the backend, and React Router / Solid Router / Vue Router
(with their nested layouts) on the frontend.
KosmoJS is the chassis, not the engine - the engine is whichever framework you chose.
[Details&nbsp;›](/routing/intro#native-routing-under-the-hood)

### Auto-Generated Boilerplate

#### What happens when I create a route file?
KosmoJS detects it and writes appropriate boilerplate -
an API route (`defineRoute`) vs a page component, matched to your framework.
You rarely write the skeleton by hand.
[Details&nbsp;›](/routing/generated-content)

#### Why doesn't my editor show generated content immediately?
Some editors load it instantly; others need a brief unfocus/refocus of the file.
[Details&nbsp;›](/routing/generated-content)

#### Why avoid anonymous arrow functions as default exports?
This applies to page components, not API routes.
A page's default export should be a named function (`export default function Page() {...}`) -
an anonymous arrow can break Vite's HMR. API routes are unaffected:
they default-export `defineRoute(...)`, which is already a named call.
[Details&nbsp;›](/routing/generated-content#client-pages)

#### How do I override the default generated template?
Pass `templates` in the generator options in `kosmo.config.ts`, keyed by glob pattern,
each value a template string written to disk as the component/route file.
[Details&nbsp;›](/frontend/custom-templates#configuration)

#### How does glob matching work for templates?
`*` matches exactly one nesting level, `**` matches any depth,
and an exact string targets a single route. Templates work with all parameter types
(`users/[id]`, `products/{category}`, `docs/{...path}`, combined).
[Details&nbsp;›](/frontend/custom-templates#pattern-syntax)

#### When multiple template patterns match, which wins?
The first matching pattern - order them most-specific first
(`landing/home` before `landing/*` before `**/*`).
[Details&nbsp;›](/frontend/custom-templates#resolution-priority)

#### How do templates help with CRUD scaffolding?
Define one template with the standard boilerplate; each generated file across many tables
starts with the right structure instead of rewriting the skeleton N times by hand.
[Details&nbsp;›](/frontend/custom-templates)

### Backend

#### How do I define an endpoint?
Default-export a `defineRoute` definition; the factory receives HTTP method builders and `use`,
and returns an array of handlers. Import `defineRoute` from `_/api`.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Can I define multiple methods in one file?
Yes - return `GET`, `POST`, `PUT`, `DELETE`, etc. in the array.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Does handler order matter?
No - dispatch is by HTTP method. Undefined methods return `405 Method Not Allowed` automatically.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Which method builders exist?
`HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Why method-based routing?
In `KosmoJS` a single route folder owns one URL, and inside it you declare a handler per HTTP method -
`GET`, `POST`, `PUT`, and so on - rather than branching on `ctx.method` or splitting verbs across files.

This keeps everything about one resource in one place:
the read, create, update, and delete logic for `/users/[id]` all live in that folder's `index.ts`,
each as its own typed handler with its own validation and middleware.

Because dispatch is by method, the handlers are declarative and order-independent -
you list them in any order and the framework routes to the right one,
returning `405 Method Not Allowed` automatically for verbs you didn't define.

The style draws on Sinatra (2007), the Ruby framework that pioneered defining routes as
`get "/path" do ... end` blocks - the same idea of a verb mapping straight to a handler,
brought into a typed, directory-based structure.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Is there HMR for the API? Why does my in-memory state reset in dev?
No HMR on backend.

On the frontend, Vite patches modules in place;
on the backend, changes trigger a hot reload: the whole program restarts, and module-level state resets with it.

That's normal for a backend - it should be stateless so it can restart and scale.

Keep persistent state in a real store (a database, even a local SQLite file),
and close connections in `teardownHandler` so they don't leak across reloads.
[Details&nbsp;›](/backend/development-workflow#hot-reload-not-hmr)

### Backend: Hono / H3 / Koa

#### Hono/H3/Koa - which should I pick, and when does it matter?
- *Hono*: Maximum performance, run unchanged across runtimes (Node, Deno, Bun, Workers), and prefer a clean, return‑based API.
- *H3*: Similar to Hono in performance and multi‑runtime support, but with a stronger focus on Web standards and framework‑agnostic design.
- *Koa*: Battle-tested, mature ecosystem, Node-focused. Great for traditional Node.js servers where you value stability and a large library ecosystem.

[Details&nbsp;›](/backend/intro)

#### What's identical and what differs between Hono/H3/Koa implementation?
Identical: route organization, middleware patterns, validation,
the `use` API, slots, cascading middleware.
Different: the context API inside handlers (body, params, state, error model).
[Details&nbsp;›](/backend/intro)

#### How do params differ in Hono vs H3 vs Koa?
Raw params: `ctx.req.param()` (Hono), `event.context.params` (H3), `ctx.params` (Koa) - all return untyped strings.

Always prefer `*.validated.params` - the validated, refined type (e.g., number) with runtime validation automatically enforced.
The validation logic is identical across all frameworks.
[Details&nbsp;›](/backend/context#route-parameters)

#### How do I set the response in Hono/H3/Koa implementation?
The native way for every framework:
- *Hono*: `ctx.json(...)` / `ctx.text(...)` (return a Response‑like object)
- *H3*: Return the value directly - an object is serialized as JSON (application/json),
a string is sent as plain text (text/plain). You can also return a Response for full control.
- *Koa*: `ctx.body = ...` (mutate the context)

All three frameworks support setting status codes and headers as well
(e.g., `ctx.res.status = 201` in Hono, `event.res.status = 201` in H3, `ctx.status = 201` in Koa).
[Details&nbsp;›](/backend/intro)

#### How do the error models differ?
- *Hono*: `app.onError()` catches everything (`await next()` does not throw).
It captures any error thrown in handlers; returns a `Response`.
- *H3*: Uses `app.use(onError(errorHandler))` as the global error handler.
It captures any error thrown in handlers; returns a `Response`, plain object or string.
- *Koa*: Errors bubble up through `await next()`. Koa emits an `error` event (for logging),
but doesn't send a response automatically. Use `app.on("error", errorHandler)` to react on `error` event.
Use `try`/`catch` around `await next()` in middleware to set `ctx.status`/`ctx.body`.

[Details&nbsp;›](/backend/error-handling)

### Backend: Context

#### What is `ctx.bodyparser`?
A unified parser API - `.json()`, `.form()`, `.raw()` - identical across frameworks.
Results are cached, so calling the same parser repeatedly doesn't re-parse.
[Details&nbsp;›](/backend/context#unified-bodyparser)

#### Do I usually call bodyparser directly?
Rarely - defining a validation schema runs the appropriate parser automatically
and places the result in `ctx.validated`.
[Details&nbsp;›](/backend/context#unified-bodyparser)

#### What is `ctx.validated`?
The validated, typed result for each target you defined:
`ctx.validated.json`, `.query`, `.headers`, `.cookies`, `.form`, `.raw`, `.params`.
[Details&nbsp;›](/backend/context#validated-data-access)

#### Do the raw params still work?
Yes - `ctx.req.param()` (Hono), `event.context.params` (H3), `ctx.params` (Koa) still return raw strings if you need them.
[Details&nbsp;›](/backend/context#route-parameters)

### Backend: Middleware

#### How do I add route-level middleware?
Use the `use` builder inside `defineRoute`. By default middleware applies to all HTTP methods;
call `next()` to continue, skip it to short-circuit.
[Details&nbsp;›](/backend/middleware#basic-usage)

#### How does the onion model work?
Middleware runs in definition order going in, then unwinds in reverse after the handler.
Global `api/use.ts` runs first, then route-level `use`, then the handler, then back out.
[Details&nbsp;›](/backend/middleware#execution-order-onion-model)

#### Why do `use` calls run before handlers regardless of array position?
This is intentional, not a quirk of how you order the array. `use` registers middleware
and the method builders (`GET`, `POST`, ...) register handlers;
the framework always runs the middleware chain first, then the matched handler -
so a `use` written after a handler in the array still runs before it.
If you need logic to run *after* the handler, put it after `await next()` inside a middleware:
code before `await next()` runs on the way in, code after it runs on the way back out (the onion model).
[Details&nbsp;›](/backend/middleware#execution-order-onion-model)

#### How do I restrict middleware to specific methods?
Pass the `on` option to `use`, listing the methods the middleware should run for.
Handlers for other methods skip it:
```ts
use(async (ctx, next) => {
  ctx.state.user = await verifyToken(ctx.headers.authorization);
  return next();
}, { on: ["POST", "PUT", "DELETE"] })
```
The same `on` option works in cascading `use.ts` files.
[Details&nbsp;›](/backend/middleware#method-specific-middleware)

#### What are middleware slots?
Named positions in the middleware chain - middleware with the same slot name
replaces earlier middleware at that position, letting you override global defaults per-route
without bypassing everything else.
[Details&nbsp;›](/backend/middleware#slot-composition)

#### How do I register a custom slot name?
Extend the `UseSlots` interface in `api/env.d.ts`, then use `{ slot: "yourName" }` anywhere.
[Details&nbsp;›](/backend/middleware#slot-composition)

#### When I override via slot, does `on` inherit from what I'm replacing?
No - `on` doesn't inherit; set it explicitly if needed.
[Details&nbsp;›](/backend/middleware#slot-composition)

#### How do `use.ts` files wrap subtrees?
Place `use.ts` in a folder and it automatically wraps all routes in that folder and its subfolders -
no imports or wiring. `api/users/use.ts` wraps everything under `/api/users`;
`api/users/account/use.ts` wraps only `/api/users/account`.
[Details&nbsp;›](/backend/cascading-middleware#how-it-works)

#### What's the execution order across levels?
Global `api/use.ts` -> parent folder `use.ts` -> current folder `use.ts` -> route handler.
Parent always runs before child; children cannot skip parent middleware.
[Details&nbsp;›](/backend/cascading-middleware#how-it-works)

#### What is `UseT`?
A type every folder-level `use.ts` exports (even when empty) describing
what the middleware adds to context. The generator merges these so every route underneath
is typed automatically - no imports, no type args on `defineRoute`.
Inner definitions override outer ones, mirroring runtime.
[Details&nbsp;›](/backend/cascading-middleware#type-safe-context-extension)

#### How do I extend `UseT` from a parent?
Import the parent's `UseT`, intersect it, and re-export -
avoiding duplicate definitions across the hierarchy.
[Details&nbsp;›](/backend/cascading-middleware#type-safe-context-extension)

#### Why does the global `api/use.ts` ignore `UseT`?
Global middleware operates on types defined in from `api/env.d.ts`;
`UseT` is for folder-level files only, where the types cascade alongside the middleware.
[Details&nbsp;›](/backend/cascading-middleware#type-safe-context-extension)

#### Why can some params be undefined in cascading middleware?
A `use.ts` runs for every route in its subtree, including ones that don't define a given param -
so the `id` param is present for `/users/[id]` but undefined for the `/users` route
under the same `use.ts`. That's expected, not a bug. Keep cascading middleware generic -
auth, logging, rate limiting; put param-specific logic in the route handler,
where the param is guaranteed to exist.
[Details&nbsp;›](/backend/cascading-middleware#parameter-availability)

#### How do I implement auth / logging / rate limiting?
However your framework already does it - KosmoJS imposes nothing here and stays fully transparent.
Any Hono/H3/Koa middleware package works unchanged, wired the native way for your framework.
You can wire it directly in a route's `index.ts` via `use(...)`, or in a folder-level `use.ts` to cascade it over a subtree.
Nothing is KosmoJS-specific about the middleware itself; it's plain Hono/H3/Koa.
[Details&nbsp;›](/backend/cascading-middleware#common-use-cases)

### Backend: Error Handling

#### Where is the default error handler?
`api/errors.ts`, generated per source folder - a regular file you can customize freely.
[Details&nbsp;›](/backend/error-handling#default-error-handler)

#### How do I distinguish a ValidationError?
`error instanceof ValidationError` (from `@kosmojs/core/errors`) -> respond 400 with field detail;
otherwise use `error.statusCode || 500`.
[Details&nbsp;›](/backend/error-handling#default-error-handler)

#### How do I do route-level error overrides?
- *Hono*: There's a single `app.onError()` - branch on `ctx.req.path` inside it for route‑specific behavior.
- *H3*: Use `app.use(onError(errorHandler))` - branch inside based on `event.url`
or `event.context` to return route‑specific responses (a Response, plain object, or string).
- *Koa*: Use `app.on("error", errorHandler)` for global error events.
For per‑route or per‑subtree overrides, you can either:
    - Branch inside the global `errorHandler` based on `ctx.path`, or
    - Use middleware with `try/catch` around `await next()` and set `ctx.status`/`ctx.body`.

The default error handler lives in `api/errors.ts` for all frameworks.

[Details&nbsp;›](/backend/error-handling)

#### Why shouldn't I wrap handler logic in try-catch?
Let errors propagate to the central error handler instead of swallowing them per-route.
[Details&nbsp;›](/backend/error-handling#let-handlers-fail)

### Validation

#### What is runtype validation?
TypeScript types are automatically converted to JSON Schema and validated at runtime -
no separate schema language, no schemas drifting out of sync.
One type definition is the source of truth for server validation,
client (fetch) validation, and the OpenAPI spec.
[Details&nbsp;›](/validation/intro#understanding-runtype-validation)

#### How does one type give both compile-time and runtime safety?
The same definition that gives compile-time checking (autocomplete, refactor safety)
also generates the runtime validator that runs when real requests arrive -
closing the gap TypeScript can't cover at runtime.
[Details&nbsp;›](/validation/intro#understanding-runtype-validation)

#### How are validators generated?
AST parsing (via ts-morph / TFusion) extracts types and traces referenced files;
AOT compilation produces high-performance validators in `lib` via TypeBox -
direct property checks, not a generic JSON Schema interpreter.
[Details&nbsp;›](/validation/intro#how-generation-works)

#### Why is double (client + server) validation a performance gain, not a cost?
Invalid requests are caught client-side before they leave the browser,
saving bandwidth/compute and giving users instant feedback;
server validation still runs for direct API calls.
[Details&nbsp;›](/validation/intro#end-to-end-validation)

#### How do I refine params?
Pass a tuple as the second type argument to `defineRoute`;
each position maps to a param in path order (e.g. `<"users/[id]", [number]>`).
A request to `/api/users/abc` is rejected with 400 before the handler runs.
Refinements are positional, not name-based - renaming `[id]` to `[userId]` needs no change here.
[Details&nbsp;›](/validation/params#params-refinements)

#### If URL params are strings, how does a `number` param validate?
KosmoJS coerces the value before validation: type a param as `number` and `"123"` becomes `123`,
while a non-numeric `"abc"` stays a string and fails the check with a clean 400.
So you write `number` (or a numeric `VRefine`) and read a real number from `ctx.validated.params`, no manual coercing.
[Details&nbsp;›](/validation/params#params-refinements)

#### Why must the params tuple be written inline?
A pre-defined tuple *alias* loses the structural info the generator needs to emit a schema.
Individual type aliases used *inside* the inline tuple are fine -
it's only extracting the whole tuple to a named type that breaks.
[Details&nbsp;›](/validation/params#params-refinements)

#### What validation targets exist?
Metadata (any method): `query`, `headers`, `cookies`. Body (POST/PUT/PATCH): `json`, `form`, `raw`.
`form` covers both URL-encoded and multipart form data (so file uploads go here);
`raw` accepts plain text, binary data, `Buffer`, `ArrayBuffer`, or `Blob`.
[Details&nbsp;›](/validation/payload#validation-targets)

#### Can validation targets hold numbers?
Only the `query` target will coerce numbers before validation:

```ts
GET<{ query: { page: number } }>((ctx) => {
  const { page } = ctx.validated.query // page is a number
});
```

`headers`/`cookies`/`form`/`raw` never coerce numbers.

::: warning will never pass validation
`POST<{ form: { age: number } }>`
:::

`json` carries numbers natively, no coercion needed.
[Details&nbsp;›](/validation/payload#validation-targets)

#### Can validation targets hold booleans?
Only the `query` target will coerce booleans before validation - `"true"`/`"false"` become `true`/`false`:

```ts
GET<{ query: { draft?: boolean } }>((ctx) => {
  const { draft } = ctx.validated.query // draft is a boolean (or undefined)
});
```

`params` (path segments, where a boolean is meaningless), `headers`/`cookies`/`form`/`raw` never coerce booleans.

::: warning will never pass validation
`POST<{ form: { consented: boolean } }>`
:::

`json` carries booleans natively, no coercion needed.

For a non-`query` target, use a string union instead:
```ts
POST<{ form: { consented: "true" | "false" | "on" | "off" } }>
```

#### Why one body target but multiple metadata targets?
Body targets are mutually exclusive (one per handler - you can't have both `json` and `form`);
metadata targets can be combined freely. A body target on GET, or two body targets,
is flagged at dev time and the affected schema is disabled.
[Details&nbsp;›](/validation/payload#validation-targets)

#### How do I handle file uploads?
Use the `form` body target on a POST/PUT/PATCH handler - it accepts multipart form data,
so the uploaded file and any accompanying text fields are validated together as one payload.
Type the file field alongside the metadata fields (e.g. `form: { file: ..., title: string }`),
and the parsed result is available on `ctx.validated.form` like any other validated body.
[Details&nbsp;›](/validation/payload#validation-targets)

#### How do I validate responses, and why bother?
The `response` property as a positional tuple: `[status, contentType, Schema]`,
e.g. `[200, "json", User]`.
It validates before sending (catching handlers that return incomplete objects
or drifted DB/third-party shapes) and enables automatic OpenAPI generation.
[Details&nbsp;›](/validation/response)

#### Does response validation run in production?
Not by default: in production, response validation is disabled by default.
To enable, set `runtimeValidation: true` on the response target.
There is no global switch: each handler enable its own response validation.
[Details&nbsp;›](/validation/response#development-vs-production)

#### Can I use referenced types and generics?
Fully supported - import shared types, use generic wrappers like `Payload<User>`.
The generator resolves generics, traces all referenced types,
and rebuilds the schema when a shared type changes.
[Details&nbsp;›](/validation/payload#referenced-types)

#### Inline object type vs `Payload<T>` for the `json` target - are they equivalent?
Yes. An inline literal (`json: { email: VRefine<string,{format:"email"}> }`)
and a named wrapper (`json: Payload<CreateUser>`) express the same thing -
the validated body schema. Use inline for one-off shapes and a named type to reuse a domain model.
[Details&nbsp;›](/validation/payload#referenced-types)

#### What is VRefine?
It adds JSON Schema constraints to the target type - globally available, no import.
`VRefine<number, { minimum: 1, multipleOf: 1 }>`. The first argument is the base type,
the second is any valid JSON Schema validation keyword.
[Details&nbsp;›](/validation/refine)

#### Which constraints apply where?

- Strings: `minLength`, `maxLength`, `pattern`, `format`
- Numbers: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- Arrays: `minItems`, `maxItems`, `uniqueItems`.

The second VRefine argument accepts any valid JSON Schema validation keyword,
so the underlying keyword family is broader than the constraints listed here.
[Details&nbsp;›](/validation/refine)

#### Why does `number` allow decimals, and how do I get integers?
Plain `number` permits floats. Use `multipleOf: 1` for true integers -
critical for DB IDs, where a float passes validation but gets rejected at the query level,
turning a clear validation error into a confusing DB error.
[Details&nbsp;›](/validation/refine)

#### How do I validate emails / date-times / patterns?
`format: "email"`, `format: "date-time"`, or a `pattern` regex via VRefine.
[Details&nbsp;›](/validation/refine)

#### What does a ValidationError expose?
`target` (which request part failed: `params`/`query`/`headers`/`cookies`/`json`/`form`/`raw`/`response`),
`errors` (array of `ValidationErrorEntry` with `keyword`/`path`/`message`/`params`/`code`),
`errorMessage` (all errors as one string), `errorSummary` (e.g. "2 validation errors found across 2 fields"),
`route`, and `data` (the data that failed).
[Details&nbsp;›](/validation/error-handling#validationerror-properties)

#### How do I surface field-level form errors?
Map `error.errors` to `{path, message}` pairs; `target` tells you which request part failed.
Nested field paths use arrow notation (`customer > address > city`) -
match them with word-boundary regex to avoid false positives.
[Details&nbsp;›](/validation/error-handling#validationerror-properties)

#### How do I set custom per-field error messages?
The second type argument to the handler accepts a per-target message set:
an `error` fallback plus `"error.fieldName"` overrides (dot notation for nested fields,
e.g. `"error.order.shipping.address.postalCode"`).
KosmoJS picks the most specific message; it appears in each entry's `message`.
[Details&nbsp;›](/validation/error-handling#custom-error-messages)

#### Why must I avoid built-in type names?
Names like `Event`, `Response`, `Request`, `Error`, `Date`, `Partial`, `Record`, `Buffer`
are referenced as-is during type flattening, so the validator sees the built-in,
not your custom type - a silent runtime failure with no compile error.
Use a consistent `T` suffix/prefix (`EventT`, `TResponse`).
The full list is in the TFusion builtins reference.
[Details&nbsp;›](/validation/naming-conventions#why-this-matters)

#### How do I skip runtime validation but keep types?
Per-target `runtimeValidation: false` in the second type argument (works for payload and response).
You then read the body via the bodyparser directly.

Param validation cannot be skipped - params are part of the URL structure.

For response targets the same flag is also the production opt-in: response validation only runs in production when set to `true`.

Use sparingly: runtime validation is what catches mismatched DB responses, unexpected payloads, and API drift.
[Details&nbsp;›](/validation/skip-validation)

### Type Safety

#### What type arguments does defineRoute accept?
- RouteName (required)
- Params refinemets tuple
- Types unique to this specific route
    - Variables and Bindings for Hono
    - Context for H3
    - State and Context for Koa

[Details&nbsp;›](/backend/type-safety#typing-state-context)

#### How do I type Cloudflare bindings (e.g. D1) in Hono?
The 4th type argument (`{ DB: D1Database }`) for a single route,
or `DefaultBindings` in `api/env.d.ts` globally; read via `ctx.env.DB`.
[Details&nbsp;›](/backend/type-safety#typing-state-context)

#### How do I add global context/state types?
Declare them in `api/env.d.ts` via module augmentation:
- `DefaultVariables`/`DefaultBindings` (Hono)
- `DefaultContext` (H3)
- `DefaultState`/`DefaultContext` (Koa)

[Details&nbsp;›](/backend/type-safety#global-context-types-apienvdts)

#### Can I relax TypeScript strictness, e.g. `exactOptionalPropertyTypes`?
Yes, per source folder - the folder's `tsconfig.json` (`src/<folder>/tsconfig.json`)
extends the generated base config, so anything you set in its `compilerOptions` wins:

```json [src/front/tsconfig.json]
{
  "extends": "../../lib/front/tsconfig.json",
  "compilerOptions": { // [!code ++:3]
    "exactOptionalPropertyTypes": false
  }
}
```

`exactOptionalPropertyTypes: true` is the deliberate default:
validated optional params round-trip exactly as declared (`status?: T` means *absent*, not `status: undefined`),
which most codebases coming from looser configs notice immediately.
Relaxing it - or any other strictness flag - is a per-folder choice and only affects that folder's typecheck.

#### How do I typecheck?
`pnpm typecheck` - same shape as `dev` and `build`: no arguments checks every source folder,
folder names check just those (`pnpm typecheck admin front`).

Each folder is checked against its own `tsconfig.json` - that's where JSX and framework settings live.

There is no project-level typecheck because there is no project-level deliverable:
source folders are what you build and deploy, so they are also the unit of typechecking.

### Fetch Clients

#### How are fetch clients generated?
Automatically for every API route, derived from the same type definitions -
change the API and the client updates, no manual sync.
Output lands in `lib` alongside validators and the OpenAPI spec.
[Details&nbsp;›](/fetch/intro)

#### How do I call a client?
`import fetchClients from "_/fetch"`, then `fetchClients["users/[id]"].GET([123])`.
[Details&nbsp;›](/fetch/start#method-signatures)

#### What's the method signature?
First argument is a params array in path order; second is the optional payload
(`{ query }`, `{ json }`, etc.). Every type is inferred from the route definition -
params, payload, and response alike.
[Details&nbsp;›](/fetch/start#method-signatures)

#### How do I call a route with no params or no payload?
No params: call with no array (`fetchClients["users"].GET()`).
Payload but no params: pass `[]` for params (`GET([], { query: {...} })`).
If the route defines no payload, the second argument isn't required.
[Details&nbsp;›](/fetch/start#routes-without-parameters-or-payloads)

#### Are requests validated before they leave the browser?
Yes - clients validate params and payload before any network request,
using the exact same TypeBox schemas as the server.
Invalid data throws immediately, no round trip.
[Details&nbsp;›](/fetch/validation)

#### What are validationSchemas, and how do I use them in forms?
Each client exposes `validationSchemas` (`params`, `json.POST`, etc.) for real-time UI feedback.
Four methods: `check(data)` (cheap boolean, safe per keystroke), `errors(data)`
(field-level array, only after `check` fails), `errorMessage(data)` (one string),
`errorSummary(data)` (brief overview). Gate the heavy three behind `check`.
[Details&nbsp;›](/fetch/validation#validation-schemas)

#### How do I do performant per-field validation as users type?
Schemas validate whole objects, so on a partially-filled form `check` fails
for *all* missing required fields, not just the one under test.
Fix: merge the field under test into a fully-valid placeholder payload
(`{ ...validPayload, name: e.target.value }`) so `check` only fails for that field.
On submit, always validate the real payload. Most forms don't need this -
it matters for complex forms validating in real time.
[Details&nbsp;›](/fetch/validation#per-field-validation-performance)

#### How do I build URLs without making a request?
`path([123])` -> `/api/users/123`; `path([123], { query: { include: "posts" } })` adds a query string;
`href("https://api.example.com", [123])` builds an absolute URL.
Multiple params follow path order.
[Details&nbsp;›](/fetch/validation)

#### How do I distinguish ValidationError from network errors on the client?
`import fetchMap, { ValidationError } from "_/fetch"`;
`error instanceof ValidationError` means data failed validation and no request was made
(it carries `target`/`errors`/`errorMessage`/`errorSummary`);
anything else is a network or server error.
[Details&nbsp;›](/fetch/utilities)

#### How does it integrate with framework data patterns?
Clients return standard promises, so they drop into SolidJS `createResource`,
React Router `loader`/`useLoaderData`, TanStack Query `queryFn`, or a `useEffect`
hook. Types flow through these abstractions automatically. Render-time patterns
(loader, resource) also run during SSR in-process; a `useEffect` fetch only runs
on the client.
[Details&nbsp;›](/fetch/integration)

#### How do I get a route's response type on the client?
You usually don't need to - awaiting a method already gives a typed result
(`const user = await fetchClients["users"].GET([123])` types `user` from the route's response).
For out-of-band typing - a `createAsync` accessor, a `useLoaderData()` result,
a prop, a shared helper - import `ResponseT` from `_/fetch`, keyed by route name then method:
`ResponseT["users"]["GET"]`.
[Details&nbsp;›](/fetch/type-safety#response-types)

#### Why is my route missing from `ResponseT`?
`ResponseT` is opt-in: an entry exists only for routes whose handler declares a `response` type.
A route with no `response` has no `ResponseT` entry - the same reason it has no response validation.
Add a `response` to the handler and the entry (and validation) appear together.
[Details&nbsp;›](/fetch/type-safety#response-types)

#### What's the response type when a handler returns multiple responses?
A handler can declare a union of responses; `ResponseT` collapses to a union of their body types,
dropping any variant with no body (no third tuple element, like a bare `[409]`).
So `[201, "json", User] | [202, "json", { queued: true }] | [409]` yields `User | { queued: true }`.
[Details&nbsp;›](/fetch/type-safety#multiple-responses)

### Frontend

#### Which frontend frameworks are supported?
React, SolidJS, Vue, Svelte, and MDX - each with a dedicated generator bridging directory routing
to the framework's native router and reactive model.
[Details&nbsp;›](/fetch/integration)

#### How do I enable a generator on an existing folder?
Register the generator (e.g. `reactGenerator()`) in the folder's `kosmo.config.ts` and restart
the dev server. The generator inserts its own Vite plugin automatically - don't add the plugin
yourself (e.g. `@vitejs/plugin-react`), or it runs twice.
[Details&nbsp;›](/frontend/intro#enabling-the-generator)

#### What `jsxImportSource` does each framework need?
React `"react"`, SolidJS `"solid-js"`, Vue `"vue"` (only when using JSX), MDX `"preact"`.
Mixing frameworks needs per-folder tsconfig - KosmoJS generates a `tsconfig.json`
per folder in `lib/` for your folder's `tsconfig.json` to extend from.
[Details&nbsp;›](/frontend/intro#typescript-configuration)

#### What foundation files does a framework generator produce?
A root App component (your app shell), a router config (`routerFactory`),
and a client entry point (`entry/client`). SSR adds a server entry.
[Details&nbsp;›](/frontend/intro#enabling-the-generator)

#### What is routerFactory?
It wires your App + generated routes to the native router.
Its callback returns `clientRouter()` (browser navigation) and `serverRouter(url)` (SSR routing).
Generated routes are always wrapped inside your App, establishing the layout hierarchy,
and use the folder's `baseurl`.
[Details&nbsp;›](/frontend/application#router-configuration)

#### What is renderFactory?
It orchestrates `mount()` (fresh client mount) vs `hydrate()` (hydrate SSR HTML),
choosing automatically via `__KOSMO_HYDRATION_BOOL__` global var.
Referenced from `index.html` through `entry/client`.
[Details&nbsp;›](/frontend/application#application-entry)

#### Are page components lazy-loaded?
Yes - all page components are lazy-loaded by default and fetched on demand,
keeping the initial bundle small. The generated route shape differs slightly
per framework's router format.
[Details&nbsp;›](/frontend/routing#lazy-loading)

### Layouts

#### How do layout files work?
A `layout` file in any `pages/` folder wraps every route in that folder and its subfolders;
nest layouts by nesting folders. No imports or config - the file system defines the hierarchy,
and child routes cannot escape parent layouts.
[Details&nbsp;›](/frontend/layouts#define-a-layout)

#### What's the nested render order?
Outermost App -> each layout in path order -> the page. E.g. for `/dashboard/settings/profile`:
`App` -> `dashboard/layout` -> `dashboard/settings/layout` -> page.
[Details&nbsp;›](/frontend/layouts#define-a-layout)

#### What's the recognized layout filename per framework, and is it case-sensitive?
`layout.tsx` (React/SolidJS), `layout.vue` (Vue), `layout.svelte` (Svelte), `layout.mdx` (MDX) - lowercase only.
Other casings are treated as regular components.
Each folder runs one framework and ignores other frameworks' files (a Vue folder ignores `.tsx`, etc.).
[Details&nbsp;›](/frontend/layouts#layout-file-naming)

#### Why isn't my pages/layout.* file loaded?
Layout files only apply inside route folders.
A layout outside a route folder is not picked up. `page/layout.*` files are simply ignored.
If you look for a global layout that wraps every route, that's the `src/<folder>/app.*` file.
[Details&nbsp;›](/frontend/layouts#global-layout-via-app-file)

#### What does the root app file wrap, and how is it different from a layout?
`src/<folder>/app.*` at the source-folder root wraps every route -
the place for truly global concerns (auth checks, analytics, error boundaries).
A `layout` file only works inside a route folder, wrapping the whole subtree.
Place it outside a route folder and it does nothing.
[Details&nbsp;›](/frontend/layouts#global-layout-via-app-file)

#### How does each framework render the child route?
React `<Outlet/>`, Vue `<RouterView/>`, SolidJS and MDX `props.children`, Svelte `{@render children()}`.
[Details&nbsp;›](/frontend/layouts#layout-implementation)

#### How do I load data in a layout?
Layouts are route-level, so a `layout.tsx` uses the same loader/preload a page does.
React (`loader` + `useLoaderData`), Solid (`preload` + `query`/`createAsync`),
Vue, Svelte, and MDX (all `loader` + `useLoaderData`) all load
at the layout level, fetching shared data once for everything beneath it.
For Vue, Svelte, and MDX a layout passes its path-qualified name to `useLoaderData`
(e.g. `useLoaderData("dashboard/layout")`) to read its own data rather than the
page's; React and Solid scope per route automatically.
[Details&nbsp;›](/frontend/layouts#data-loading-in-layouts)

### Navigation (typed Link)

#### How does the typed Link component work?
The generator produces a `Link` at `components/Link.{tsx,vue}` with compile-time route validation.
The `to` prop takes a typed tuple `[routeName, ...params]` (e.g. `["users/[id]", 123]`),
plus an optional `query` prop. Typing the route name triggers IntelliSense;
parameterized routes require their params.
[Details&nbsp;›](/frontend/link-navigation#usage)

#### What's the refactor-safety benefit?
Renaming a route directory produces TypeScript errors at every `Link` referencing the old name -
turning refactors into an automated checklist.
[Details&nbsp;›](/frontend/link-navigation#linkprops-type)

### Data Preload

#### How does route-level preloading work per framework?

`GET` here is a method off the generated fetch client for the route
(`const { GET } = fetchClients["users/data"]`) - exported under the name the framework's
router expects.

- React: `export { GET as loader }` - React Router calls it before render;
`useLoaderData<ResponseT[...]>()` retrieves the typed result with no duplicate request
(runs on load, hover, navigation).

- SolidJS: wrap the fetch in `query()` and export it as `preload` - called on
hover/intent; `createAsync` calling the same `query`-wrapped function reuses the
cached result. The raw client `GET` isn't cached, so the `query()` wrapper is
what makes preload and `createAsync` share one fetch.

- Vue: `export const loader` in a plain `<script>` block (a `<script setup>`
can't hold ES exports) - the router runs it before render, and the page reads
the result with `useLoaderData()`.

- MDX: `export const loader` too - runs before render, and the page reads the
result with the `useLoaderData()` hook (`props` stays yours).

[Details&nbsp;›](/frontend/data-preload#page-integration)

#### Do I need a Suspense boundary for data fetching?
For SolidJS, yes - `createAsync` (like `createResource`) suspends, reporting pending state
to the nearest `<Suspense>` and errors to the nearest `<ErrorBoundary>`. KosmoJS
ships no boundary: the generated `App` renders children directly, on purpose -
one app-wide `<Suspense>` is an anti-pattern (any pending fetch collapses the
whole page to a single fallback). Scope a boundary to the data component or a
subtree yourself. React, Vue, Svelte, and MDX loaders resolve before render and
don't suspend, so they need none unless you reach for something like `React.lazy`,
`use()`, or an async `<script setup>`.
Wrapping the whole app works if you accept the tradeoff - your call, not a default.
[Details&nbsp;›](/frontend/data-preload#suspense-is-your-responsibility)

### MDX

#### When should I use MDX over React/Vue/Solid/Svelte?
MDX for content-primary folders (documentation, blogs, marketing) -
rendered to static HTML with Preact, minimal client JS by default.
React/Vue/Solid/Svelte for interactivity-primary folders (dashboards, client-side state, real-time forms).
Rule of thumb: primarily content with occasional interactivity -> MDX;
primarily interactive with occasional content -> a framework.
[Details&nbsp;›](/frontend/mdx#when-to-use-mdx-vs-frameworks)

#### How do I write MDX pages?
`.mdx`/`.md` files in `pages/`, mixing markdown and JSX, with YAML frontmatter between `---` fences.
Import Preact components directly.
[Details&nbsp;›](/frontend/mdx#writing-pages)

#### How do I access the current route inside a component?
Call the `useRoute()` hook from `_/use`. It returns the route `name`, the validated `params`,
and the page's `frontmatter` together, so a shared component (a breadcrumb, a title bar) can
read where it is without receiving props from the page. This is distinct from a framework's
own `useParams` - `useRoute()` also carries the route name and frontmatter, not just params.
[Details&nbsp;›](/frontend/mdx#route-parameters)

#### How do I fetch data in MDX?
Export a `loader` function from the page. It runs before the page renders,
through the same fetch client used elsewhere in the project.
[Details&nbsp;›](/frontend/mdx#data-fetching)

#### How do I access fetched data in MDX?
Read it with the `useLoaderData()` hook inside a component - `props` stays yours.
Because a hook must run during render, wrap the read in a small component
(`export const Msg = () => { const data = useLoaderData(); return <p>{data.msg}</p>; }`)
and place `<Msg />` in the markdown.
[Details&nbsp;›](/frontend/mdx#data-fetching)

#### How do I use route name/params inside an MDX loader?
`loader` runs before the component tree exists, so hooks (`useParams()`, `useRoute()`) aren't available there -
they only work while Preact is actually rendering a component.
Instead, `loader` receives the resolved `Route` object as its argument, including `paramsEntries` -
a `[keys, values]` tuple in the same order the route declares its parameters,
ready to pass straight to a parametrized endpoint (`GET(params)`).
[Details&nbsp;›](/frontend/mdx#loaders-with-route-parameters)

#### Is SSG enabled on MDX folders?
Yes, by default - SSG is MDX-only, so there is nothing to enable.
Each route renders to its own static HTML file at build time,
with staticParams supplying the entries for dynamic routes.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### How does SSG handle dynamic routes?
Declare variants via `staticParams` in frontmatter; the build renders one HTML file per entry.
Static routes render automatically.
Dynamic routes without `staticParams` are skipped from the SSG build entirely.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### How do I fetch data in MDX in SSG mode?
Same `loader` export, combined with `staticParams`. `loader` runs once per declared entry,
receiving that entry's own `paramsEntries`, and each entry's fetched data gets baked into its
own pre-rendered HTML file.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### How do I turn SSG off for an MDX folder?
Remove/comment `ssgGenerator()` from that folder's `kosmo.config.ts`.
The folder keeps rendering normally, it just stops emitting static routes.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### Why can't I write TypeScript in MDX?
MDX only supports plain JavaScript expressions.
Keep typed code (props, hooks, types) in `.tsx` files and import them into the MDX page.
[Details&nbsp;›](/frontend/mdx#common-pitfalls)

#### How do I override markdown elements globally?
The component map in `components/mdx.tsx` (applied through `MDXProvider`) -
override `h1`, `pre`, links, etc. for all pages. Individual pages can still import additional components.
[Details&nbsp;›](/frontend/mdx#using-components)

#### How does frontmatter drive the head?
`title`, `description`, and a `head` array in frontmatter inject `<head>` content automatically -
the same convention as VitePress, no new syntax.
[Details&nbsp;›](/frontend/mdx#frontmatter-head-injection)

#### What are the common MDX pitfalls?
No TypeScript in MDX (keep it in `.tsx`); hooks must be called inside components,
not at module scope (`export const x = useParams()` runs on import and fails);
`loader` can't use hooks either, since it runs before the tree exists - use the `Route`
argument instead; curly braces in prose are parsed as JSX - wrap in backticks;
layouts must be `.mdx` not `.md` (`.md` can't render `{props.children}`).
[Details&nbsp;›](/frontend/mdx#common-pitfalls)

### SSR

#### Is SSR on by default?
No - folders default to client-side rendering (with Vite's dev server and HMR in dev). Enable
SSR when you create the folder (choose it in the interactive prompt, or pass `--ssr` in CLI
mode), or add it later by registering `ssrGenerator()` in `kosmo.config.ts` and restarting dev.
[Details&nbsp;›](/frontend/server-side-render#adding-ssr-support)

#### Does SSR run in dev?
No - in dev, Vite handles all requests with HMR and CSR for immediate feedback.
SSR activates exclusively in production builds.
(This commonly surprises Next/TanStack migrators who expect dev to mirror prod rendering.)
[Details&nbsp;›](/frontend/server-side-render#development-experience)

#### renderToString vs renderToStream?
Both return `{ head, html }` - `renderToString` resolves `html` to a string (full page
rendered before sending), `renderToStream` resolves it to a `ReadableStream` (progressive
flushing, better TTFB). Framework folders implement both; which one runs per route is
chosen by `renderMode`, not by precedence. MDX is the exception - it renders static
content and implements only `renderToString`.
[Details&nbsp;›](/frontend/server-side-render#server-entry-point)

#### What do the render methods receive?
Both share the same first two arguments - the requested URL plus `SSROptions`:
`template` (client `index.html` with `<!--app-html-->` placeholder),
`manifest` (Vite's dependency graph),
and `assets` (SSR assets you inject manually, each offering `kind`/`tag`/`content`/`size`,
plus an optional `path` - content-only assets like inlined scripts have no URL).
`renderToStream` also receives the stream as a third argument for custom flushing control.
[Details&nbsp;›](/frontend/server-side-render#render-factory-arguments)

#### Why must I inject SSR assets manually but not CSR assets?
CSR's index.html already carries the client asset tags.
For SSR, the server asks your renderer for `{ head, html }` and builds the document from them -
so composing assets into head is just your side of that handoff, not a Vite workaround.
[Details&nbsp;›](/frontend/server-side-render#render-factory-arguments)

#### How does streaming work across runtimes?
`renderToStream` (imported from `_/entry/server`) returns a web-standard `ReadableStream`
for every framework, so streaming behaves the same on Node, Bun, and Deno. You return the
stream as `html`; the server handles writing it into the response. Enable it per route via
`renderMode`.
[Details&nbsp;›](/frontend/server-side-render#stream-rendering)

#### How do I use a different render mode per route or group of routes?
`renderMode` in `ssrGenerator()` options controls string vs stream per route. Every route
defaults to `"string"`; set `"stream"` to stream all routes, or pass a map of glob patterns to
opt in selectively. When patterns overlap, the first match wins, so order them specific to
general. Streaming a route needs the folder's renderer to implement `renderToStream`; MDX
folders render static content and don't accept the streaming mode.
[Details&nbsp;›](/frontend/server-side-render#selecting-the-render-mode)

#### How do I build and run the SSR bundle, and on which runtimes?
`pnpm build` produces `dist/<folder>/ssr/server.js`. Run it with `node`, `bun`,
or `deno run -A` (`... -p 4556`). Unix sockets are supported across all three (`-s /tmp/app.sock`).
It uses `node:http`, natively supported by all three runtimes.
[Details&nbsp;›](/frontend/server-side-render#runtime)

#### Can I serve the SSR static assets so they don't hit the SSR server?
Yes. In-memory serving of `dist/<folder>/ssr/assets/` can't be turned off, but you can put a
reverse proxy or CDN in front to serve that folder directly, so asset requests never reach the
SSR process.
[Details&nbsp;›](/frontend/server-side-render#static-asset-handling)

#### How do I deploy behind Nginx/Caddy?
Reverse-proxy to the SSR port (or a Unix socket). The SSR bundle includes the API, so it serves
API requests on the same port seamlessly - no separate API process needed alongside it.
[Details&nbsp;›](/frontend/server-side-render#production-deployment)

#### What breaks during SSR?
Browser APIs (`window`, `document`, browser-only APIs) are unavailable server-side.
Coordinate async data so it's ready before render, plan state serialization for hydration,
and remember the hydration bundle still ships to clients (size still matters).
Use error boundaries so a server error doesn't terminate the process.
[Details&nbsp;›](/frontend/server-side-render#technical-considerations)

#### How do I fetch data during SSR?
Use your framework's render-time data path - a `loader` (React, Vue, Svelte, MDX), a
`preload` (Solid), or a Solid `createResource`/Suspense resource - and call the
generated fetch client inside it. During
SSR the client dispatches to the API route in-process (the API server is bundled into the SSR
bundle), so there's no network hop, just the full validation/handler chain. A fetch in
`useEffect`/`onMounted` won't run on the server - those fire only after hydration.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

### Build & Deployment

#### How do I build all folders vs one?
`pnpm build` (all) or `pnpm build front` (one).
[Details&nbsp;›](/backend/building-for-production)

#### What's the build output layout?
`dist/<folder>/` with `api/` (`app.js` factory + `server.js` bundled server),
`client/` (`assets/` + `index.html`), and `ssr/` (`app.js` + `server.js` + `assets/` folder, only when SSR is enabled).
[Details&nbsp;›](/backend/building-for-production#build-output)

#### What's the simplest way to run the API in production?
`node dist/front/api/server.js`. For more control, use the app factory at `dist/<folder>/api/app.js`.
[Details&nbsp;›](/backend/building-for-production#running-in-production)

#### How do I mount the app factory per runtime?
- *Hono*: `app.fetch` is a Web Fetch handler - on Node use `getRequestListener` from `@hono/node-server`.
Deno via `Deno.serve`, Bun via `Bun.serve`.
- *H3*: `app.fetch` is a Web Fetch handler - on Node use `toNodeHandler` from `h3/node` (then createServer).
Deno via `Deno.serve`, Bun via `Bun.serve`.
- *Koa*: On Node use `app.listen()`. On Deno/Bun use `app.callback()` via a compat layer, not their native serve APIs.
[Details&nbsp;›](/backend/building-for-production#running-in-production)

#### Why are the API and SSR servers separate?
They're built as separate bundles so you can deploy, scale, and run them independently. But the
SSR bundle already includes the API and serves it on the same port, so an SSR deployment doesn't
need a separate API process. Running the API server on its own is only needed for CSR folders,
where there's no SSR bundle to carry it.
[Details&nbsp;›](/backend/building-for-production#build-output)

### OpenAPI

#### Does it auto-generate OpenAPI?
Yes - OpenAPI 3.1 directly from route definitions, TypeScript types, `VRefine` constraints,
parameters, and responses. No manual schema authoring or annotation layers.
[Details&nbsp;›](/openapi)

#### How do I enable and configure it?
Add `openapiGenerator(config)` in `kosmo.config.ts`. Required: `outfile`, `openapi` (e.g. `"3.1.0"`),
`info` (`title` + `version`), `servers` (each `url` + optional `description`).
Optional `info`: `summary`, `description` (markdown), `termsOfService`, `contact`, `license`.
[Details&nbsp;›](/openapi#configuration)

#### Why does one route with an optional param produce two paths?
OpenAPI requires all path params to be mandatory, so a route like `users/[id]/posts/{postId}`
emits both `/users/{id}/posts/{postId}` and `/users/{id}/posts` -
both referencing the same handlers and schemas.
[Details&nbsp;›](/openapi#generated-specification)

#### Does the spec regenerate automatically?
Yes - it regenerates in the background whenever you change routes, types, or schemas,
alongside the validation and fetch generators.
[Details&nbsp;›](/openapi#generated-specification)

#### How do I serve the spec?
Point Swagger UI, Redoc, or Stoplight Elements at the generated file.
[Details&nbsp;›](/openapi#generated-specification)

### Dev Workflow & Internals

#### What happens when the dev server starts?
Vite compiles `api/app.ts`; the dev server serves both client pages and your API routes;
requests are routed between Vite and your API; a file watcher monitors API files for changes.
[Details&nbsp;›](/backend/development-workflow#what-happens-on-start)

#### What are the api/dev.ts hooks?
`requestHandler` (returns the API request handler) and `teardownHandler`
(runs before each API reload).
[Details&nbsp;›](/backend/development-workflow#api-dev-ts)

#### How do I add custom request routing (e.g. WebSockets)?
Override `requestHandler` in `api/dev.ts` for custom dispatch, WebSocket handling,
multi-handler setups, etc.
[Details&nbsp;›](/backend/development-workflow#apidevts)

#### Why are my DB connections leaking during development?
Frequent rebuilds can exhaust connections. Close connections and release resources
in `teardownHandler`, which runs before each reload.
[Details&nbsp;›](/backend/development-workflow#apidevts)

#### How do I inspect registered routes and their middleware?
Pass the `debug` option to `appFactory` in `api/app.ts`:
`debug: true` prints each route's path, methods, middleware chain (by slot), and handler.
For targeted output pass one of `"headline"` / `"methods"` / `"middleware"` / `"handler"`,
or pass a function `debug(log, route)` for a custom logger - `log` carries all four parts plus `full`.
[Details&nbsp;›](/backend/development-workflow#inspecting-routes)

#### Why should I name my middleware functions?
Named functions print by name in the debug output; anonymous ones print only their first line,
which is much harder to read.
[Details&nbsp;›](/backend/development-workflow#inspecting-routes)

#### How does validation generation performance scale?
With type complexity - simple routes are near-instant, deep hierarchies with many dependencies
take a few seconds. Generation runs in parallel with the Vite dev server and is cached per file,
so schemas regenerate only when the route file or a type dependency changes.
By the time you switch to the browser, the schema is ready.
[Details&nbsp;›](/validation/performance)

#### When does a slow full rebuild happen?
Deleting the `lib` folder manually, or a KosmoJS update bumping the cache version.
On large projects this can take minutes - the same category as clearing `node_modules`
or regenerating a Prisma client, not part of the normal edit-test cycle.
[Details&nbsp;›](/validation/performance#when-it-becomes-noticeable)

#### How does this compare to Zod/Yup on performance vs maintenance?
Zod/Yup have zero generation overhead because you hand-write the schemas -
eliminating generation time but adding ongoing maintenance and drift risk.
KosmoJS trades a few seconds of machine time for eliminating that manual work entirely.
[Details&nbsp;›](/validation/performance#machine-time-vs-human-time)

#### Where does generated code live?
In `lib`, kept out of your source directories and bundled like any other dependency
at production build time. Treat it as a build artifact - you don't need to read it.
[Details&nbsp;›](/validation/intro#how-generation-works)

### Mental Model & Positioning

#### What is KosmoJS the equivalent of?
A meta-framework that owns routing conventions, the validation pipeline, middleware composition,
dev workflow, and build orchestration - while you keep control of backend, frontend,
state, styling, database, and deploy target.
[Details&nbsp;›](/about)

#### Is it full-stack like Next, or just router + build orchestrator?
Both sides, but with an explicit client/server boundary rather than a unified Server Components model.
You get directory routing for `api/` and `pages/`, plus typed validation, generated fetch clients,
OpenAPI, opt-in SSR, and build orchestration.
[Details&nbsp;›](/features)

#### Does it pick a frontend for me like Next?
No - you choose React, Vue, SolidJS, Svelte, or MDX per source folder, and can mix them across folders.
[Details&nbsp;›](/frontend/intro)

#### Does the Svelte support require SvelteKit?
No - KosmoJS uses only Svelte's UI layer (component compilation, `mount`/`hydrate`),
not SvelteKit. Routing, data loading, and SSR come from KosmoJS itself, so a Svelte
page uses the same `loader` export + `useLoaderData()` hook as MDX, not SvelteKit's
`load` function or `+page` files.
[Details&nbsp;›](/frontend/intro)

#### How does it compare to TanStack's "bring your own everything"?
Similar spirit on the app layer - unopinionated about state/styling/data libraries -
but it adds conventions for routing, validation, and build that TanStack leaves to you,
and it enforces type safety at runtime (generated validators), not only at compile time.
[Details&nbsp;›](/about)

#### Is it opinionated about state/styling/data fetching?
No - you keep full control. KosmoJS handles infrastructure, not your app stack.
[Details&nbsp;›](/about)

#### Does it own deployment like Next/Vercel?
No platform lock-in. It's a standard Node/Vite app -
deploy the bundled servers to Node/Bun/Deno/edge yourself.
You can still deploy to Vercel as a Node app, but there are no Vercel-specific features
(and no dependence on them).
[Details&nbsp;›](/backend/building-for-production#running-in-production)

#### What does it give me over Vite + React Router + Hono wired by hand?
Directory routing for both sides, generated runtime validators from TS types,
generated typed fetch clients, automatic OpenAPI, multi-folder orchestration,
and per-folder build/deploy - without the DIY glue that becomes load-bearing.
[Details&nbsp;›](/features)

#### Is it a meta-framework or monorepo tooling?
A meta-framework using source folders - monorepo structure and independence without workspaces,
package boundaries, internal dependency graphs, or build-cache configs.
[Details&nbsp;›](/about)

### Routing

#### What's the equivalent of Next's `app/page.tsx`?
A folder with an `index` file: `pages/users/[id]/index.tsx` -> `/users/:id`.
(TanStack file-based plugin users: same idea, folder-driven.)
[Details&nbsp;›](/routing/intro#how-it-works)

#### Why folders-with-`index` instead of `page.tsx`?
Only `index` is the route; siblings are colocated helpers - unambiguous at scale.
[Details&nbsp;›](/routing/rationale)

#### How do params map to Next's / TanStack's?

- `[id]` <-> Next `[id]` / TanStack `$id` (required)
- `{id}` <-> optional
- `{...path}` <-> Next `[...slug]` (splat/catch-all)

Different sigils, same concepts.
[Details&nbsp;›](/routing/params)

#### Catch-all / optional catch-all (`[[...slug]]`)?
Splat `{...path}` covers both. It matches any number of segments including zero,
so it behaves like Next's optional catch-all `[[...slug]]` - `docs/{...path}` matches `/docs`
as well as `/docs/a/b/c`. There's no separate required-vs-optional catch-all distinction to manage.
[Details&nbsp;›](/routing/params#splat-parameters)

#### Type-safe params like TanStack Router?
Yes - refine params via the inline tuple type arg to `defineRoute`;
`ctx.validated.params` carries the refined type, validated at runtime
(stronger than TanStack's compile-time-only route typing,
which doesn't validate request bodies by itself).
[Details&nbsp;›](/backend/type-safety#typing-params)

#### Where's the central route tree (TanStack `routeTree.gen.ts`) / route config object?
There isn't one you register. Routing is filesystem-driven;
route configs are generated per source folder into `lib/` for the native router to consume.
Treat generated code as a build artifact.
[Details&nbsp;›](/frontend/routing#generated-route-shape)

#### Route groups like Next's `(group)`?
There's no route-group syntax, and it isn't needed. Next's `(group)` is a lightweight way
to organize routes without affecting the URL - a workaround for separating concerns inside one app.
KosmoJS separates concerns at a higher level: source folders are independent apps
with their own framework, base URL, middleware, and build,
so the separation route groups gesture at is structural here, not a naming convention.
[Details&nbsp;›](/routing/intro)

#### Parallel / intercepting routes (`@slot`, `(.)`)?
These are Next App Router features with no KosmoJS equivalent.

Parallel routes (`@slot`) render several independent pages into named slots of the same layout at once -
e.g. a dashboard showing a feed and an analytics panel side by side,
each with its own loading and error state.

Intercepting routes (`(.)`, `(..)`) show a route in a different context depending on how you arrive:
the classic case is clicking a photo to open it in a modal over the current page,
while loading the same URL directly renders the full photo page.

KosmoJS has neither convention - it maps one folder to one route.
You'd build the same UX with your framework's own tools:
render multiple components in a layout and fetch their data independently for the parallel case,
and use client-side modal state (or your router's modal patterns) for the intercepting case.
[Details&nbsp;›](/routing/intro)

#### Nested layouts vs Next `layout.tsx` / TanStack `_layout`?
Same idea - a `layout` file wraps its folder and subfolders, nesting by folders,
rendered outward-in via `<Outlet/>` (React), `<RouterView/>` (Vue), `props.children` (Solid/MDX), or `{@render children()}` (Svelte).
[Details&nbsp;›](/frontend/layouts#define-a-layout)

#### Do layouts persist state across navigation like App Router?
Yes, in the normal case. When you navigate between sibling routes under the same layout,
only the child swaps in - the layout component stays mounted,
so it doesn't re-render and its state is preserved.
This is the standard behavior of the underlying routers (React Router, Vue Router, Solid Router)
that KosmoJS registers routes with. A layout only remounts when navigation moves outside its subtree.
[Details&nbsp;›](/frontend/layouts)

#### `loading.tsx` / `error.tsx` / `not-found.tsx`?
There are no per-route special files for these, because they're handled with each framework's
own primitives rather than a KosmoJS file convention.

Global loading, suspense, and error boundaries live at the `app.*` level,
using the native principles of your chosen framework.

Not-found has a built-in: a `pages/404.*` component is rendered for unmatched routes.
Backend errors are separate - they centralize in `api/errors.ts`.
[Details&nbsp;›](/frontend/layouts#global-layout-via-app-file)

#### `beforeLoad` / search-param validation hook?
KosmoJS doesn't add a proprietary `beforeLoad`-style hook - it leaves your framework's
primitives untouched, so you use the native pattern directly:

- React Router's `loader`
- Solid Router's `preload`
- Vue's `loader` export for data; Vue Router's navigation guards remain available
for pre-load checks and redirects

For the data contract itself, search params are validated via the `query` target
on handlers (with VRefine constraints) and surfaced through the generated,
client-side-validating fetch clients.
[Details&nbsp;›](/frontend/data-preload#page-integration)

#### Typed/validated search params like TanStack search schemas?
Not implemented yet - it's a considered feature.
KosmoJS validates query params on the API contract
(the `query` target gives full types and constraints, surfaced through the fetch clients),
but there's no router-level `validateSearch` that types `useSearch()` on the *page route*
the way TanStack does - query typing centers on the API/fetch boundary,
not page-route search state. For now, read and parse search params with your framework's native router.
[Details&nbsp;›](/validation/payload#validation-targets)

### Data Fetching

#### React Server Components / `"use server"` boundary?
No RSC, and no `"use client"`/`"use server"` directive boundary - by design, not omission.
KosmoJS keeps the battle-tested industry standard: server code in `api/`,
client code in `pages/`, and a plain HTTP API between them with typed fetch clients across the wire.
There's no interleaving of server and client code in one file and no new mental model to learn -
the boundary is the network call. Boring, as in 2015 - and boring is a feature here. And with
the isomorphic fetch client that boundary costs nothing on the server: during SSR the call runs
in-process, so there's no network layer at all.
[Details&nbsp;›](/frontend/intro)

#### How about server functions?
There aren't any, and you don't need them. A server function exists to run server-only code from
the client without hand-writing an endpoint; KosmoJS gives you that through the API route plus its
generated typed client. The same client is isomorphic - during SSR it calls the route in-process
(no network hop), on the client it's a same-origin request - so one typed call covers both sides
without a separate server-function primitive.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

#### Can a page fetch from the database server-side without an API hop?
Not the RSC way - data flows through the API layer, not direct DB access in the page.
But during SSR that isn't a network hop: the isomorphic fetch client dispatches to the
API route in-process (no socket), so you get the API boundary without the round-trip cost.
The de-facto model is API routes + generated clients + framework loader/preload.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

#### Loaders like TanStack Start/Router?
Yes, every framework uses own pattern - `export loader` on React / Vue / Svelte / MDX, `export preload` on SolidJS.
The loader is simply your generated fetch client's method exported as `loader`/`preload`,
so the typed response flows into `useLoaderData`/`createAsync`.
[Details&nbsp;›](/frontend/data-preload#page-integration)

#### Is there loader caching / staleness / `loaderDeps`?
No built-in loader cache - React/Solid reuse the in-flight/cached result for that navigation;
SolidJS `preload` results are cached/reused by `createAsync`.
For real caching, enable TanStack Query (a first-class option).
[Details&nbsp;›](/frontend/tanstack-query)

#### How do I enable TanStack Query?
Turn it on when you create the source folder - interactive mode asks,
or pass `--tsq` non-interactively (`pnpm folder --name front --base / --framework react --tsq`).

To add it later, set the `tanstack` option on the framework generator in `kosmo.config.ts`
(`reactGenerator({ tanstack: { query: true } })`).

Once it's on, everything is wired - no setup, no provider to place - you just start using it in your components.
[Details&nbsp;›](/frontend/tanstack-query#enabling-and-using-it)

#### How do I read data with TanStack Query once it's enabled?
Just write the read: `useQuery` against a fetch client (`queryKey` + `queryFn: () => GET([id])`) in a component.
Frameworks differ only at the hook: React and Vue take the options object directly;
Solid and Svelte take a thunk (`() => (...)`) to stay reactive;
and Svelte's hook is `createQuery`, not `useQuery`.
[Details&nbsp;›](/frontend/tanstack-query#basic-usage)

#### How do I warm TanStack Query on the server (SSR)?
To render a page's data on the server and hydrate it warm, you wire it yourself with TanStack's own primitives -
`dehydrate` on the server, `HydrationBoundary`/`hydrate` on the client - following your framework's official SSR guide.

The one KosmoJS-specific detail: get the request-scoped client from `getQueryClient()` in your loader,
so you prefetch into the same client the render reads, and share one query-options
helper between loader and component so the `queryKey` matches.

(Solid needs no boundary - its `generateHydrationScript()` carries the cache automatically.)
[Details&nbsp;›](/frontend/tanstack-query#ssr-warmup-advanced)

#### How do I do mutations with TanStack Query?
Exactly as TanStack documents - no KosmoJS-specific wiring.
`mutationFn` calls the fetch client's `POST`/`PUT`/etc.,
and `queryClient.invalidateQueries({ queryKey })` in `onSuccess` refetches the affected queries in place -
the thing a loader alone can't do without re-navigating.
Mutations are client-side, so SSR doesn't affect them.
[Details&nbsp;›](/frontend/tanstack-query#mutations-and-invalidation)

#### How do I get a Query client, or configure one?
`_/query` provides two exports: `getQueryClient()` and `createQueryClient(options)`.

Use `createQueryClient(options)` when you need a custom staleTime, retry policy, etc.
Create the custom client in your `app.{tsx,vue,svelte}` and provide it as a prop to `AppProvider`.
[Details&nbsp;›](/frontend/tanstack-query#configuring-a-custom-client)

#### Does SSR data fetching work without extra plumbing?
Yes - the generated fetch client is isomorphic.

During SSR a render-time fetch (a `loader` or `createAsync`) dispatches to the API route in-process,
and the framework's own hydration carries the result to the client:
every framework reuses the server-rendered data without re-fetching.

React and Solid do it through their built-in hydration;
Vue, Svelte, and MDX serialize the loader result into the page
and read it on the client before the loader would fetch.
You don't wire dehydrate/hydrate for that.

TanStack Query is an optional opt-in layer - if you enable it and want its cache serialized across SSR,
that plumbing is on you (via TanStack's own dehydrate/hydrate),
but it isn't required for fetch-client data to survive hydration.
[Details&nbsp;›](/fetch/integration#isomorphic-fetch)

#### fetch caching / `revalidatePath` / `revalidateTag` / ISR?
No fetch cache extensions, no tag/path revalidation, no ISR. Cache at the CDN/proxy layer;
MDX SSG is full static generation. After a mutation, refetch or invalidate your own client cache.
[Details&nbsp;›](/openapi)

#### Preload on link hover/intent - which frameworks?
React `loader` runs on load/hover/navigation; SolidJS `preload` runs on hover/intent
(cached by `query`/`createAsync`); Vue, Svelte, and MDX run their `loader` before render.
Loader (React/Vue/Svelte/MDX) and preload (SolidJS) make data ready before render, eliminating route-level spinners.
[Details&nbsp;›](/frontend/data-preload#how-it-works)

### Server Actions / Mutations / RPC

#### Server Actions (`"use server"`) / Start server functions (`createServerFn`)?
No server actions and no RPC-style server functions.
Do mutations by defining a normal API route (`POST`/`PUT`/`DELETE`)
and calling its generated typed client, validated client-side first.
(There's no progressive-enhancement no-JS form submit as a first-class feature,
and no `useFormState`/`useActionState` equivalent -
use your framework's form state plus the client's `validationSchemas` for field errors.)
[Details&nbsp;›](/fetch/start#method-signatures)

#### End-to-end RPC type safety like tRPC?
Effectively yes via generated clients - params, payload,
and response types derive from the same route definition,
with client-side validation before the request.
The difference: it's route-based (path keys + HTTP methods) rather than procedure-based,
and backed by generated TypeBox validators plus automatic OpenAPI.
[Details&nbsp;›](/fetch/intro)

#### Client-side input validation like a tRPC input schema?
Yes - the client validates params/payload before sending, using the same server schemas,
so client-valid and server-accepted stay in sync.
[Details&nbsp;›](/fetch/validation#validation-schemas)

### Backend / API

#### Next Route Handlers (`route.ts`) / Start `createAPIFileRoute` equivalent?
`defineRoute` returning an array of method handlers in `api/.../index.ts` - same idea,
plus validation and a generated client for free. You don't write `Response.json()`.
There's no `NextRequest`/`NextResponse` - it's the native Hono/H3/Koa context.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Why an array instead of named method exports?
The factory yields method builders + `use`; returning an array lets you compose middleware
and methods together with shared types.
[Details&nbsp;›](/backend/intro#defining-endpoints)

#### Run on the edge / Cloudflare / Deno / Bun?
With Hono and H3 the API runs on Node/Deno/Bun/Cloudflare Workers and edge platforms unchanged (`app.fetch`).
Koa runs via the `node:http` compat layer. There's no automatic serverless/edge function packaging like Next -
you run the bundled server or wire `app.fetch` into an edge runtime yourself.
[Details&nbsp;›](/backend/building-for-production#running-in-production)

#### Edge middleware (`middleware.ts`) vs cascading `use.ts`?
There's no global edge-middleware file or client-route interception layer.
API middleware is per-subtree via auto-wrapping `use.ts` plus slots;
to gate a subtree behind auth, drop a `use.ts` in its folder (typed context via `UseT`).
For the client side, use the global `App.*` wrapper or a layout.
[Details&nbsp;›](/backend/cascading-middleware#how-it-works)

#### Bring Hono ecosystem middleware?
Yes - e.g. `hono-rate-limiter` is shown wired through `use`.
There's no bundled auth (no NextAuth integration) - wire your own in middleware:
verify token, set `ctx.state.user` / `ctx.set("user")`.
[Details&nbsp;›](/backend/cascading-middleware#common-use-cases)

#### Typed env/bindings (e.g. D1)?
Hono bindings are typed via `defineRoute`'s 4th type arg or `DefaultBindings` in `api/env.d.ts`
(e.g. `DB: D1Database`), read via `ctx.env.DB`.
[Details&nbsp;›](/backend/type-safety#typing-state-context)

### Validation & Types

#### Does it use Zod like TanStack often does?
No - "runtype" validation: TS types -> JSON Schema -> TypeBox validators, generated automatically.
You write TS types once; validators are generated, eliminating hand-written schemas
and type/schema drift. One source of truth drives compile-time types, runtime validation,
client validation, and OpenAPI.
[Details&nbsp;›](/validation/intro#understanding-runtype-validation)

#### Do I lose flexibility without Zod?
Constraints come via `VRefine` (JSON Schema keywords like `minLength`, `pattern`,
`format`, `minimum`, `multipleOf`, `minItems`);
for trusted endpoints set `runtimeValidation: false` to keep types only.
The generated fetch clients validate with the exact server schemas,
so client and server stay in sync with nothing to keep aligned by hand.
[Details&nbsp;›](/validation/skip-validation)

#### Can I extract a `VRefine` constraint object into a named type?
No - the constraint (the second argument) must always be written inline as an object literal,
never referenced by name (local `type` alias or imported). Both forms typecheck,
but only the inlined one produces a working schema: the constraint is emitted as schema text
and re-parsed by TypeBox against a fixed set of known identifiers,
so a named reference survives as an unresolved identifier and every value is silently rejected.
This is the same inline-or-break rule as the `params` refinement and `response` body tuples.
The base type (the first argument) has no such restriction -
`VRefine<MyStringAlias, { ... }>` and imported base types flatten normally.
[Details&nbsp;›](/validation/refine#inline-the-constraints-never-reference-them)

#### Is type safety runtime-enforced or compile-only?
Both - the same TS type drives compile-time checks and generated runtime validators.
This is stronger than TanStack's compile-time route typing,
which doesn't validate request bodies on its own.
[Details&nbsp;›](/validation/intro#understanding-runtype-validation)

#### Why is there a codegen/generation step at all?
Validators are AOT-compiled from types (TanStack users used to instant route typing
should expect a brief generation pass, cached per file, running alongside Vite).
A slow full rebuild only happens when you delete `lib/` or a cache-version bump occurs -
akin to regenerating `routeTree.gen.ts` from scratch, but heavier.
Treat generated code as a black box, like the generated route tree.
[Details&nbsp;›](/validation/performance#machine-time-vs-human-time)

### Rendering & SSR

#### Is KosmoJS CSR-first, and how do I enable SSR?
Yes - folders default to CSR with Vite's dev server and HMR.
Opt into SSR via `ssrGenerator()` (or `--ssr` at creation). SSR runs in production builds, not dev.
Whether a folder is SSR or CSR is a per-folder choice (e.g. an SSR marketing folder + a CSR app
folder); within an SSR folder, `renderMode` selects string vs stream per route by glob pattern.
[Details&nbsp;›](/frontend/server-side-render#adding-ssr-support)

#### ISR / on-demand revalidation / PPR?
No ISR/revalidation and no partial prerendering.
[Details&nbsp;›](/frontend/server-side-render)

#### SSG / static export vs `output: export`?
SSG suported by MDX folders only, rendering each route to static HTML (`staticParams` for dynamic routes) -
purpose-built for docs/blog/marketing with frontmatter-driven head, layouts, and typed nav.
Comparable to Next + MDX/Contentlayer but built in.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### Can I use SSG with React, Vue, SolidJS or Svelte?
Nope - SSG is MDX-only. For others use SSR instead, per-folder -
an MDX folder for docs/marketing alongside an SSR or CSR folder for the app is the intended shape.
Extending SSG to other frameworks is an open consideration though.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

#### Islands / partial hydration?
Not offered as a named feature. MDX delivers minimal client JS by default and hydrates;
React/Solid/Vue hydrate the app via `renderFactory`.
[Details&nbsp;›](/frontend/server-side-render)

#### `metadata` / `generateMetadata` / `<head>` management?
MDX frontmatter drives `<head>` (title/description/head array);
for app frameworks you set head in the SSR entry's returned `head` and in components.
No `metadata` export convention.
[Details&nbsp;›](/frontend/mdx#frontmatter-head-injection)

### Project Structure, Tooling & Config

#### Different framework per folder, sharing types without `packages/shared`?
Yes - e.g. MDX marketing, React app, Vue admin in one project,
importing types directly across folders with no publishing or workspace protocols.
Folders develop together as one project and deploy independently while sharing infrastructure.
[Details&nbsp;›](/features)

#### Is Vite exposed/configurable? What replaces `next.config.js`?
It's built on Vite (no proprietary runtime/bundler).
Configure per folder via `kosmo.config.ts` with `plugins` and `generators` arrays,
plus standard Vite config. There's no `app/` vs `pages/` debate - you're in `src/<folder>/{api,pages}`.
[Details&nbsp;›](/frontend/intro)

#### Output vs `.next/`, and a `next start` equivalent?
`dist/<folder>/` with `api/`, `client/`, and `ssr/`.
Run the bundled server: `node dist/front/api/server.js` (API)
or `node dist/front/ssr/server.js -p 4556` (SSR).
No adapter system - Hono/H3 via native runtime servers, Koa via `node:http`.
[Details&nbsp;›](/backend/building-for-production#build-output)

#### `next/image` / `next/font` / `next/link` / `next/head` equivalents?
A generated typed `Link` exists. Head injection is via MDX frontmatter and the SSR `head`.
There's no `next/image` (image optimization) or `next/font` equivalent - bring your own.
[Details&nbsp;›](/frontend/link-navigation)

#### Vs Next multi-zone?
The source-folder model is the multi-app story: per-folder base URLs, frameworks,
and builds within one project, sharing types and a database layer -
so where Next stitches separate deployments together with multi-zone,
KosmoJS keeps the apps in one codebase with no zone configuration.
[Details&nbsp;›](/features)

### OpenAPI

#### Does it really auto-generate OpenAPI, and how does it compare to hand-written / tRPC-OpenAPI?
Yes - OpenAPI 3.1 from routes, types, VRefine constraints, params, and responses,
with no manual authoring, kept live as routes change (TanStack has no built-in equivalent).
Serve it with Swagger UI, Redoc, or Stoplight Elements.
[Details&nbsp;›](/openapi)

---

### Agents

An LLM agent must answer these before emitting KosmoJS code that compiles and runs.

#### A1. Which backend is this folder - Hono/H3/Koa?
Check the folder's `kosmo.config.ts`: a `honoGenerator()` or `h3Generator()` or `koaGenerator()`
in the `generators` array tells you which backend is in use.

#### A2. Which frontend framework is this folder - React, SolidJS, Vue, Svelte, or MDX?
Check the folder's `kosmo.config.ts` for the framework generator
(`reactGenerator()`, `solidGenerator()`, `vueGenerator()`, `svelteGenerator()`, or `mdxGenerator()`),
or look at the page file extensions (`.tsx`/`.vue`/`.svelte`/`.mdx`).
It matters because data preload (React `loader`+`useLoaderData`,
SolidJS `preload`+`createAsync`, Vue/Svelte/MDX `loader`+`useLoaderData`),
child rendering (React `<Outlet/>`, Vue `<RouterView/>`, Solid/MDX `props.children`, Svelte `{@render children()}`),
entry wiring, layout filename (`layout.tsx`/`.vue`/`.svelte`/`.mdx`),
`jsxImportSource` (`react`/`solid-js`/`vue`/`preact`),
and mixed-segment support (full for Vue/Svelte/MDX, `.ext`-only for React, none for SolidJS) all differ.

#### A3. Is this an API route or a page?
API routes default-export `defineRoute(...)` returning an array of method handlers;
pages default-export a component function (named, not an anonymous arrow, which would break Vite HMR).
KosmoJS generates the correct boilerplate when the file is created.

#### A4. Is the params refinement tuple inline?
It must be written inline on `defineRoute` (e.g. `defineRoute<"users/[id]", [number]>`) -
extracting the whole tuple to a named type alias loses the structural info
the generator needs and breaks schema generation.
Individual type aliases used *inside* the inline tuple are fine.

#### A5. Does any user-defined type collide with a JS/DOM/TS built-in name?
`Event`, `Response`, `Request`, `Error`, `Date`, `Partial`, `Record`, `Buffer`, etc.
are referenced as-is during type flattening, so the validator sees the built-in rather than your type -
a silent runtime failure with no compile error.
Rename with a consistent `T` suffix/prefix (`EventT`, `TResponse`).

#### A6. Is any validation target combination illegal?
Two body targets, or a body target on GET, is a dev-time error
(KosmoJS warns and disables the affected schema).
The valid shape is one body target (`json`/`form`/`raw`, mutually exclusive)
plus any combination of metadata targets (`query`/`headers`/`cookies`, valid on any method).

#### A7. Should this be cascading `use.ts` or route-level `use`?
Shared across a route subtree -> a cascading `use.ts` in that folder
(it auto-wraps the folder and subfolders and exports a `UseT`
that cascades context types to child routes). One route only -> an inline `use` inside `defineRoute`.
Keep cascading middleware generic - it runs for sibling routes too,
so a param like `id` may be undefined there.

#### A8. Does this folder have SSR enabled, and is this the dev or prod path?
SSR only runs in production builds; dev is always Vite CSR + HMR
regardless of whether `ssrGenerator()` is registered.
Don't reason about "the SSR code path" while looking at the dev server -
the server entry (`renderToString`/`renderToStream`) executes only after `pnpm build`.

#### A9. For numeric constraints, is an integer required?
Plain `number` allows floats - use `VRefine<number, { minimum: 1, multipleOf: 1 }>`
for a positive integer ID. Without `multipleOf: 1`, `1000.5` passes validation
and then gets rejected at the DB layer, turning a clear validation error into a confusing query error.

#### A10. For navigation, is the typed `Link` tuple correct for this route's params?
`to={["users/[id]", 123]}` - a typed tuple of route name then params in path order,
with an optional `query` prop. TypeScript enforces the param types,
and renaming a route folder surfaces errors at every `Link` using the old name.

#### A11. Creating a new api route/use file or client page/layout file - who writes the boilerplate?
**Never generate the boilerplate yourself.** Your template knowledge can be outdated -
imports, factory signatures, and generated-file wiring may change with each release.
Create the file **empty** and let kosmo land the current boilerplate, then update it accordingly.
This also keeps the scaffolding pipeline in its intended flow: kosmo owns file scaffolding, you own the logic you put into it.

Two ways to land the boilerplate:
- **Local machine:** the running dev server picks the file up on creation and fills it in.
- **Containers / CI / remote sandboxes:** do **not** rely on the dev server -
file watching inside containers is prone to inotify/watcher trouble (limits, wedged half-terminated instances, event loss),
which surfaces as files silently never picked up.
Instead, create the empty files and run the **build** command: it resolves routes with exactly the same code as the dev server,
writes the boilerplate, and wires the routes - deterministically, no watcher involved.

#### A12. Where is the latest authoritative source?
Always prefer fetching `https://kosmojs.dev/llms-full.txt` over memory for exact generator option names,
the full VRefine keyword set, and exact scaffold flags -
the conventions are dense and easy to get subtly wrong.
Every answer above links to its source documentation page for the authoritative detail.
