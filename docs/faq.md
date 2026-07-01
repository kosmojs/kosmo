---
title: KosmoJS FAQ
description: Frequently asked questions about KosmoJS for developers and LLM agents
outline: [2, 3]
---

**KosmoJS FAQ**

### Getting Started & Project Setup

#### What is KosmoJS and what problem does it solve?
A composable meta-framework for organizing multiple apps in one project.

It avoids the friction of microservices (drifting shared types, separate CI/deploy),
monorepos (workspace/package/build-cache overhead and a `packages/shared` dumping ground),
and DIY glue (hand-rolled scripts that become load-bearing).

Instead it uses a Vite-inspired "source folders" approach: the structure of a monorepo,
the simplicity of a single project, and the independence of separate apps -
without the overhead of any of them.

You keep control of backend, frontend, state, styling, database, and deploy target;
KosmoJS owns routing conventions, the validation pipeline, middleware composition,
dev workflow, and build orchestration.
[Details ›](/about)

#### Is KosmoJS a runtime, a bundler, or a framework?
A meta-framework that sits on top of Vite. There is no proprietary runtime, no custom bundler,
and no framework lock-in - every layer (Vite, Koa/Hono, React/Vue/Solid/MDX)
is a tool you can use, debug, and replace independently.
[Details ›](/about)

#### How do I create a new KosmoJS project?
Run `npm create kosmo` (or `pnpm create kosmo` / `yarn create kosmo`),
then `cd my-app` and install dependencies.
[Details ›](/start)

#### How do I run create non-interactively?
Pass `--name`, e.g. `npm create kosmo --name my-app`.
[Details ›](/start)

#### How do I add a source folder?
Run `npm run +folder` (or `pnpm +folder` / `yarn +folder`).
[Details ›](/start)

#### What am I prompted for when adding a source folder?
Folder name, base URL, framework, backend, and SSR/SSG. Non-interactive flags:
`--name`, `--base`, `--framework solid|react|vue|mdx`, `--backend koa|hono`, `--ssr`, `--ssg`.
[Details ›](/start)

#### Why isn't a source folder created automatically?
By design - you add folders as needed, one per distinct concern, each independent.
This keeps intent explicit.
[Details ›](/about)

#### Why install again after adding a source folder?
Adding a folder pulls in framework-specific dependencies that need to be installed.
[Details ›](/start)

#### How do I start the dev server and what's the default port?
`pnpm dev` (all folders) or `pnpm dev front` (one folder). Default port is `4556`.
[Details ›](/backend/development-workflow.html#starting-the-dev-server)

#### How do I change the dev port?
It's the `devPort` value in `package.json`.
[Details ›](/backend/development-workflow.html#starting-the-dev-server)

#### How does this compare to Next.js / Nuxt / SolidStart / tRPC / a hand-rolled Vite setup?
Unlike Next/Nuxt/SolidStart it doesn't choose your frontend or own your deploy model;
unlike tRPC it's route-based (not procedure-based) and also generates OpenAPI and runtime validators;
unlike a hand-rolled Vite setup it provides directory routing for both sides,
generated validation/clients, and multi-folder build orchestration without the DIY glue.
[Details ›](/features)

### Source Folders

#### What is a source folder?
A self-contained app inside the project with its own framework stack, base URL,
routing, middleware, layouts, config, and build output -
but sharing one `package.json`, one `node_modules`, one database layer, and one set of types.
Example layout:
- `src/app` (React + Hono, base `/app`)
- `src/admin` (Vue + Koa, base `/admin`)
- `src/marketing` (MDX, no backend, base `/`)

[Details ›](/features)

#### How is this different from a monorepo package / microservices / DIY glue?
Folders are not separate packages: no workspaces, no package boundaries,
no internal dependency graph, no publishing, no versioning, no workspace protocols.
You get monorepo-like structure and microservice-like independence with single-project simplicity.
[Details ›](/about)

#### Can different folders use different frameworks/backends at the same time?
Yes. Each folder picks its own backend (Koa/Hono) and frontend (React/Vue/SolidJS/MDX),
and they coexist in one project.
[Details ›](/features)

#### How do folders share types without publishing/versioning?
Import a type directly across folders; change a database model and every folder sees it immediately.
No publishing, no workspace protocols.
[Details ›](/frontend/intro.html#multi-folder-architecture)

#### Can I build/deploy a single folder?
Yes - `pnpm build front` builds just that folder; folders develop and deploy independently.
[Details ›](/backend/building-for-production)

#### How do I run/build all folders vs one?
`pnpm dev` / `pnpm build` for all; append a folder name (`pnpm dev front`, `pnpm build admin`) for one.
[Details ›](/backend/development-workflow.html#starting-the-dev-server)

#### Do routes/types leak between folders?
No - generated types and utilities are scoped per folder.
The admin dashboard's navigation types won't include the main app's routes, and vice versa.
[Details ›](/frontend/intro.html#multi-folder-architecture)

#### When should I split into separate folders?
One folder per distinct concern (main app, admin, marketing).
A useful rule for SSR vs CSR: deploy an SSR folder for marketing content
and a CSR folder for the app rather than mixing SSR/CSR within one folder.
[Details ›](/frontend/server-side-render.html#technical-considerations)

### Directory-Based Routing

#### How does routing map files to URLs?
Folder names become path segments; `index` files define the endpoint or component:
- `api/users/[id]/index.ts` maps to `/api/users/:id`
- `pages/users/[id]/index.tsx` maps to `/users/:id`.

No separate routing config - your file structure is your route definition.
[Details ›](/routing/intro.html#how-it-works)

#### Why directory-based instead of file-based?
Clarity at scale: only `index.ts` is a route handler; every other file in the folder
is an obviously-colocated helper. File-based routing leaves `schema.ts`/`auth.ts`/`utils.ts` ambiguous -
route or helper? Directory-based removes that ambiguity.
The only cost is creating a folder even when it holds just `index.ts`.
[Details ›](/routing/rationale)

#### Why must every route be a folder with an `index` file, even the root?
Consistency - no special cases. The base route uses a folder named `index`
(`pages/index/index.tsx` -> `/`).
[Details ›](/routing/intro.html#how-it-works)

#### How do nested routes work?
Nest folders. `api/users/[id]/posts/index.ts` -> `/api/users/:id/posts`,
as deep as your domain requires, each level colocating its own helpers, types,
and tests without affecting siblings.
[Details ›](/routing/intro.html#nested-routes)

#### Why the parallel `api/` and `pages/` structure?
Intentional - a page and its corresponding API endpoint are always one folder apart and easy to find.
[Details ›](/routing/intro.html#how-it-works)

#### How do I create an API route?
Create a folder under `api/` with an `index.ts` file - the folder path becomes the URL
and KosmoJS generates starter code automatically. For example, `api/products/index.ts`
exposes `/api/products`, and `api/products/[id]/index.ts` exposes `/api/products/:id`.
Inside, default-export a `defineRoute` that returns method handlers,
then replace the generated placeholder with real logic and visit the URL
(e.g. `http://localhost:4556/api/products`).
[Details ›](/routing/intro.html#route-file-requirements)

#### How do I create a page?
Create a matching folder under `pages/` with an `index` component file for your framework -
`pages/products/index.tsx` (React/SolidJS), `.vue` (Vue), or `.mdx` (MDX) - and it becomes `/products`.
KosmoJS generates a placeholder component you replace with your own;
the parallel `api/` and `pages/` trees mean a page and its endpoint are always one folder apart.
Pages typically read data through the generated fetch client (`fetchClients["products"].GET()`).
[Details ›](/routing/intro.html#route-file-requirements)

#### What does the `_/` prefix and `_/api` map to?
`_/` maps to `lib/` (generated code). `_/api` resolves to `lib/<folder>/api.ts`,
where `<folder>` is your source-folder name.
[Details ›](/routing/generated-content.html#api-routes)

#### What do `@/*`, `~/*`, `_/*` mean?

Reserved path mappings:
- `@/*` root-level imports
- `~/*` source-folder imports,
- `_/*` generated-code imports.

Don't reuse these prefixes for your own aliases.
[Details ›](/tutorial)

### Route Parameters

#### What are the three parameter types?

- `[id]` required (exactly one segment)
- `{id}` optional (one segment or nothing)
- `{...path}` splat (any number of segments).

Same syntax for API routes and pages.
[Details ›](/routing/params)

#### How do I read a splat parameter?
Matched segments come back as an array - for `/docs/guides/deployment/production`,
`ctx.validated.params.path` is `["guides", "deployment", "production"]`.
Useful for doc sites, file browsers, arbitrarily nested paths.
[Details ›](/routing/params.html#splat-parameters)

#### Why can't an optional param precede a required one?
It creates ambiguity; `users/{optional}/[required]` is invalid.
Optional params must not be followed by required ones (`users/{section}/{subsection}` is fine).
[Details ›](/routing/params.html#optional-parameters)

#### Why am I getting an unexpected 404 with an optional param before a static segment?
With `properties/{city}/filters`, visiting `/properties/filters` makes the router match
`{city}="filters"` and then expect another `/filters` segment that isn't there - 404.
Fix it by adding an explicit static route (`properties/filters/index.tsx`), which takes priority.
[Details ›](/routing/params.html#watch-out-for-ambiguous-paths)

#### When does a static route win over a dynamic one?
Always - static routes take priority over dynamic ones.
[Details ›](/routing/params.html#watch-out-for-ambiguous-paths)

#### How does a sibling `index` make `[id]` effectively optional?
A parent `index` provides a fallback to render, so `careers/index.tsx` + `careers/[jobId]/index.tsx`
makes `[jobId]` effectively optional. `{jobId}` communicates that intent more clearly;
both notations work identically here.
[Details ›](/routing/params.html#required-vs-optional-a-subtlety)

#### How do mixed segments work?
Static text + params in one segment: `[category].html`, `[id]-[data].json`, `[name].[ext]`.
The folder is named with the mixed segment and `index.ts` lives inside it like any other route.
[Details ›](/routing/params.html#mixed-segments)

#### Which frontends support mixed segments?
Backend (Koa/Hono): full support. Vue and MDX: full support. React Router: `.ext` suffix only.
SolidJS: not supported. Prefer simple segments for frontend routes
and keep mixed segments to the API side where support is complete.
[Details ›](/routing/params.html#mixed-segments)

#### What is power syntax?
Raw `path-to-regexp v8` patterns passed through directly.
The rule: any param name containing non-alphanumeric characters is treated as a raw pattern.
Examples: `book{-:id}-info`, `locale{-:lang{-:country}}`, `api/{v:version}/users`.
Read the path-to-regexp docs before using it in production.
[Details ›](/routing/params.html#power-syntax)

#### How do I make an optional static part (e.g. an optional `.html`)?
e.g. `products/{:category.html}` - matches `/products` and `/products/electronics.html`
but not `/products/electronics`.
[Details ›](/routing/params.html#power-syntax)

#### Does KosmoJS run its own path-to-regexp routing under the hood?
No - path-to-regexp is used only at build time to parse your directory structure into route definitions.
At runtime, those parsed routes are registered with each framework's native router
exactly as you would register them by hand, so you keep the framework's full native routing:
Hono's high-performance router on the backend, and React Router / Solid Router / Vue Router
(with their nested layouts) on the frontend.
KosmoJS is the chassis, not the engine - the engine is whichever framework you chose.
[Details ›](/routing/intro.html#native-routing-under-the-hood)

### Auto-Generated Boilerplate

#### What happens when I create a route file?
KosmoJS detects it and writes appropriate boilerplate -
an API route (`defineRoute`) vs a page component, matched to your framework.
You rarely write the skeleton by hand.
[Details ›](/routing/generated-content)

#### Why doesn't my editor show generated content immediately?
Some editors load it instantly; others need a brief unfocus/refocus of the file.
[Details ›](/routing/generated-content)

#### Why avoid anonymous arrow functions as default exports?
This applies to page components, not API routes.
A page's default export should be a named function (`export default function Page() {...}`) -
an anonymous arrow can break Vite's HMR. API routes are unaffected:
they default-export `defineRoute(...)`, which is already a named call.
[Details ›](/routing/generated-content.html#client-pages)

#### How do I override the default generated template?
Pass `templates` in the generator options in `kosmo.config.ts`, keyed by glob pattern,
each value a template string written to disk as the component/route file.
[Details ›](/frontend/custom-templates.html#configuration)

#### How does glob matching work for templates?
`*` matches exactly one nesting level, `**` matches any depth,
and an exact string targets a single route. Templates work with all parameter types
(`users/[id]`, `products/{category}`, `docs/{...path}`, combined).
[Details ›](/frontend/custom-templates.html#pattern-syntax)

#### When multiple template patterns match, which wins?
The first matching pattern - order them most-specific first
(`landing/home` before `landing/*` before `**/*`).
[Details ›](/frontend/custom-templates.html#resolution-priority)

#### How do templates help with CRUD scaffolding?
Define one template with the standard boilerplate; each generated file across many tables
starts with the right structure instead of rewriting the skeleton N times by hand.
[Details ›](/frontend/custom-templates)

### Backend: defineRoute & Handlers

#### How do I define an endpoint?
Default-export a `defineRoute` definition; the factory receives HTTP method builders and `use`,
and returns an array of handlers. Import `defineRoute` from `_/api`.
[Details ›](/backend/intro.html#defining-endpoints)

#### Can I define multiple methods in one file?
Yes - return `GET`, `POST`, `PUT`, `DELETE`, etc. in the array.
[Details ›](/backend/intro.html#defining-endpoints)

#### Does handler order matter?
No - dispatch is by HTTP method. Undefined methods return `405 Method Not Allowed` automatically.
[Details ›](/backend/intro.html#defining-endpoints)

#### Which method builders exist?
`HEAD`, `OPTIONS`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
[Details ›](/backend/intro.html#defining-endpoints)

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
[Details ›](/backend/intro.html#defining-endpoints)

### Backend: Koa vs Hono

#### Koa or Hono - which should I pick, and when does it matter?
Koa: battle-tested, mature ecosystem, Node-focused. Hono: exceptional performance,
runs on Node/Deno/Bun/Cloudflare Workers and edge platforms unchanged.
Pick Hono if you need edge/multi-runtime. Route organization, middleware patterns,
and validation are identical between them; only the in-handler context API differs.
[Details ›](/backend/intro)

#### What's identical and what differs between Koa and Hono?
Identical: route organization, middleware patterns, validation,
the `use` API, slots, cascading middleware.
Different: the context API inside handlers (body, params, state, error model).
[Details ›](/backend/intro)

#### How do params differ in Koa vs Hono?
`ctx.params` (Koa) vs `ctx.req.param()` (Hono); prefer `ctx.validated.params` in both -
it carries the refined, validated type.
[Details ›](/backend/context.html#route-parameters)

#### How do I set the response body in each?
`ctx.body = ...` (Koa) vs `ctx.json(...)` / `ctx.text(...)` (Hono).
[Details ›](/backend/intro)

#### How do the error models differ?
Koa: middleware try-catch that bubbles up (`await next()` throws);
response via mutating `ctx.body`/`ctx.status`; per-route override via the `errorHandler` slot.
Hono: `app.onError()` catches everything (`await next()` doesn't throw);
response by returning a `Response`; per-route behavior by branching inside `app.onError()`.
[Details ›](/backend/error-handling.html#koa-vs-hono-key-differences)

### Backend: Context & Bodyparser

#### What is `ctx.bodyparser`?
A unified parser API - `.json()`, `.form()`, `.raw()` - identical across frameworks.
Results are cached, so calling the same parser repeatedly doesn't re-parse.
[Details ›](/backend/context.html#unified-bodyparser)

#### Do I usually call bodyparser directly?
Rarely - defining a validation schema runs the appropriate parser automatically
and places the result in `ctx.validated`.
[Details ›](/backend/context.html#unified-bodyparser)

#### What is `ctx.validated`?
The validated, typed result for each target you defined:
`ctx.validated.json`, `.query`, `.headers`, `.cookies`, `.form`, `.raw`, `.params`.
[Details ›](/backend/context.html#validated-data-access)

#### Do the raw params still work?
Yes - `ctx.params` (Koa) and `ctx.req.param()` (Hono) still return raw strings if you need them.
[Details ›](/backend/context.html#route-parameters)

### Backend: Middleware

#### How do I add route-level middleware?
Use the `use` builder inside `defineRoute`. By default middleware applies to all HTTP methods;
call `next()` to continue, skip it to short-circuit.
[Details ›](/backend/middleware.html#basic-usage)

#### How does the onion model work?
Middleware runs in definition order going in, then unwinds in reverse after the handler.
Global `api/use.ts` runs first, then route-level `use`, then the handler, then back out.
[Details ›](/backend/middleware.html#execution-order-onion-model)

#### Why do `use` calls run before handlers regardless of array position?
This is intentional, not a quirk of how you order the array. `use` registers middleware
and the method builders (`GET`, `POST`, ...) register handlers;
the framework always runs the middleware chain first, then the matched handler -
so a `use` written after a handler in the array still runs before it.
If you need logic to run *after* the handler, put it after `await next()` inside a middleware:
code before `await next()` runs on the way in, code after it runs on the way back out (the onion model).
[Details ›](/backend/middleware.html#execution-order-onion-model)

#### How do I restrict middleware to specific methods?
The `on` option, e.g. `{ on: ["POST","PUT","DELETE"] }`.
[Details ›](/backend/middleware.html#method-specific-middleware)

#### What are slots?
Named positions in the middleware chain - middleware with the same slot name
replaces earlier middleware at that position, letting you override global defaults per-route
without bypassing everything else.
[Details ›](/backend/middleware.html#slot-composition)

#### How do I register a custom slot name?
Extend the `UseSlots` interface in `api/env.d.ts`, then use `{ slot: "yourName" }` anywhere.
[Details ›](/backend/middleware.html#slot-composition)

#### When I override via slot, does `on` inherit from what I'm replacing?
No - `on` doesn't inherit; set it explicitly if needed.
[Details ›](/backend/middleware.html#slot-composition)

### Backend: Cascading Middleware

#### How do `use.ts` files wrap subtrees?
Place `use.ts` in a folder and it automatically wraps all routes in that folder and its subfolders -
no imports or wiring. `api/users/use.ts` wraps everything under `/api/users`;
`api/users/account/use.ts` wraps only `/api/users/account`.
[Details ›](/backend/cascading-middleware.html#how-it-works)

#### What's the execution order across levels?
Global `api/use.ts` -> parent folder `use.ts` -> current folder `use.ts` -> route handler.
Parent always runs before child; children cannot skip parent middleware.
[Details ›](/backend/cascading-middleware.html#how-it-works)

#### What is `UseT`?
A type every folder-level `use.ts` exports (even when empty) describing
what the middleware adds to context. The generator merges these so every route underneath
is typed automatically - no imports, no type args on `defineRoute`.
Inner definitions override outer ones, mirroring runtime.
[Details ›](/backend/cascading-middleware.html#type-safe-context-extension)

#### How do I extend `UseT` from a parent?
Import the parent's `UseT`, intersect it, and re-export -
avoiding duplicate definitions across the hierarchy.
[Details ›](/backend/cascading-middleware.html#type-safe-context-extension)

#### Why does the global `api/use.ts` ignore `UseT`?
Global middleware operates on `DefaultState` (Koa) / `DefaultVariables` (Hono) from `api/env.d.ts`;
`UseT` is for folder-level files only, where the types cascade alongside the middleware.
[Details ›](/backend/cascading-middleware.html#type-safe-context-extension)

#### Why can some params be undefined in cascading middleware?
A `use.ts` runs for every route in its subtree, including ones that don't define a given param -
so the `id` param is present for `/users/[id]` but undefined for the `/users` route
under the same `use.ts`. That's expected, not a bug. Keep cascading middleware generic -
auth, logging, rate limiting; put param-specific logic in the route handler,
where the param is guaranteed to exist.
[Details ›](/backend/cascading-middleware.html#parameter-availability)

#### How do I implement auth / logging / rate limiting?
Define them in a `use.ts` with the appropriate `UseT`.
The docs show auth (token verify + `ctx.assert`/`HTTPException`,
setting `ctx.state.user`/`ctx.set("user")`), request logging (timing + request IDs),
and rate limiting (`koa-ratelimit` / `hono-rate-limiter` wired through `use`).
[Details ›](/backend/cascading-middleware.html#common-use-cases)

### Backend: Error Handling

#### Where is the default error handler?
`api/errors.ts`, generated per source folder - a regular file you can customize freely.
The Koa handler is wired into global middleware via the `errorHandler` slot;
the Hono handler into `app.onError()`.
[Details ›](/backend/error-handling.html#default-error-handler)

#### How do I distinguish a ValidationError?
`error instanceof ValidationError` (from `@kosmojs/core/errors`) -> respond 400 with field detail;
otherwise use `error.statusCode || 500`.
[Details ›](/backend/error-handling.html#default-error-handler)

#### How do I do route-level error overrides?
Koa: override per-route or per-subtree via the `errorHandler` slot
(inline `use` or a cascading `use.ts`). Hono: there's a single `app.onError()` -
branch on `ctx.req.path` inside it for route-specific behavior.
[Details ›](/backend/error-handling.html#route-level-overrides-koa)

#### Why shouldn't I wrap handler logic in try-catch?
Let errors propagate to the central error handler instead of swallowing them per-route.
[Details ›](/backend/error-handling.html#let-handlers-fail)

#### What do I use instead of try-catch?
`ctx.assert` / `ctx.throw` (Koa) and `throw new HTTPException(...)` (Hono).
[Details ›](/backend/error-handling.html#let-handlers-fail)

### Validation

#### What is runtype validation?
TypeScript types are automatically converted to JSON Schema and validated at runtime -
no separate schema language, no schemas drifting out of sync.
One type definition is the source of truth for server validation,
client (fetch) validation, and the OpenAPI spec.
[Details ›](/validation/intro.html#understanding-runtype-validation)

#### How does one type give both compile-time and runtime safety?
The same definition that gives compile-time checking (autocomplete, refactor safety)
also generates the runtime validator that runs when real requests arrive -
closing the gap TypeScript can't cover at runtime.
[Details ›](/validation/intro.html#understanding-runtype-validation)

#### How are validators generated?
AST parsing (via ts-morph / TFusion) extracts types and traces referenced files;
AOT compilation produces high-performance validators in `lib` via TypeBox -
direct property checks, not a generic JSON Schema interpreter.
[Details ›](/validation/intro.html#how-generation-works)

#### Why is double (client + server) validation a performance gain, not a cost?
Invalid requests are caught client-side before they leave the browser,
saving bandwidth/compute and giving users instant feedback;
server validation still runs for direct API calls.
[Details ›](/validation/intro.html#end-to-end-validation)

#### How do I refine params?
Pass a tuple as the second type argument to `defineRoute`;
each position maps to a param in path order (e.g. `<"users/[id]", [number]>`).
A request to `/api/users/abc` is rejected with 400 before the handler runs.
Refinements are positional, not name-based - renaming `[id]` to `[userId]` needs no change here.
[Details ›](/validation/params.html#params-refinements)

#### Why must the params tuple be written inline?
A pre-defined tuple *alias* loses the structural info the generator needs to emit a schema.
Individual type aliases used *inside* the inline tuple are fine -
it's only extracting the whole tuple to a named type that breaks.
[Details ›](/validation/params.html#params-refinements)

#### What payload targets exist?
Metadata (any method): `query`, `headers`, `cookies`. Body (POST/PUT/PATCH): `json`, `form`, `raw`.
`form` covers both URL-encoded and multipart form data (so file uploads go here);
`raw` accepts plain text, binary data, `Buffer`, `ArrayBuffer`, or `Blob`.
[Details ›](/validation/payload.html#validation-targets)

#### Why one body target but multiple metadata targets?
Body targets are mutually exclusive (one per handler - you can't have both `json` and `form`);
metadata targets can be combined freely. A body target on GET, or two body targets,
is flagged at dev time and the affected schema is disabled.
[Details ›](/validation/payload.html#validation-targets)

#### How do I handle file uploads?
Use the `form` body target on a POST/PUT/PATCH handler - it accepts multipart form data,
so the uploaded file and any accompanying text fields are validated together as one payload.
Type the file field alongside the metadata fields (e.g. `form: { file: ..., title: string }`),
and the parsed result is available on `ctx.validated.form` like any other validated body.
[Details ›](/validation/payload.html#validation-targets)

#### How do I validate responses, and why bother?
The `response` property as a positional tuple: `[status, contentType, Schema]`,
e.g. `[200, "json", User]`.
It validates before sending (catching handlers that return incomplete objects
or drifted DB/third-party shapes) and enables automatic OpenAPI generation.
[Details ›](/validation/response)

#### Can I use referenced types and generics?
Fully supported - import shared types, use generic wrappers like `Payload<User>`.
The generator resolves generics, traces all referenced types,
and rebuilds the schema when a shared type changes.
[Details ›](/validation/payload.html#referenced-types)

#### Inline object type vs `Payload<T>` for the `json` target - are they equivalent?
Yes. An inline literal (`json: { email: VRefine<string,{format:"email"}> }`)
and a named wrapper (`json: Payload<CreateUser>`) express the same thing -
the validated body schema. Use inline for one-off shapes and a named type to reuse a domain model.
[Details ›](/validation/payload.html#referenced-types)

#### What is VRefine?
It adds JSON Schema constraints to a primitive type - globally available, no import.
`VRefine<number, { minimum: 1, multipleOf: 1 }>`. The first argument is the base type,
the second is any valid JSON Schema validation keyword.
[Details ›](/validation/refine)

#### Which constraints apply where?

- Strings: `minLength`, `maxLength`, `pattern`, `format`
- Numbers: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- Arrays: `minItems`, `maxItems`, `uniqueItems`.

The second VRefine argument accepts any valid JSON Schema validation keyword,
so the underlying keyword family is broader than the constraints listed here.
[Details ›](/validation/refine)

#### Why does `number` allow decimals, and how do I get integers?
Plain `number` permits floats. Use `multipleOf: 1` for true integers -
critical for DB IDs, where a float passes validation but gets rejected at the query level,
turning a clear validation error into a confusing DB error.
[Details ›](/validation/refine)

#### How do I validate emails / date-times / patterns?
`format: "email"`, `format: "date-time"`, or a `pattern` regex via VRefine.
[Details ›](/validation/refine)

#### What does a ValidationError expose?
`target` (which request part failed: `params`/`query`/`headers`/`cookies`/`json`/`form`/`raw`/`response`), `errors` (array of `ValidationErrorEntry` with `keyword`/`path`/`message`/`params`/`code`), `errorMessage` (all errors as one string), `errorSummary` (e.g. "2 validation errors found across 2 fields"), `route`, and `data` (the data that failed).
[Details ›](/validation/error-handling.html#validationerror-properties)

#### How do I surface field-level form errors?
Map `error.errors` to `{path, message}` pairs; `target` tells you which request part failed.
Nested field paths use arrow notation (`customer > address > city`) -
match them with word-boundary regex to avoid false positives.
[Details ›](/validation/error-handling.html#validationerror-properties)

#### How do I set custom per-field error messages?
The second type argument to the handler accepts a per-target message set:
an `error` fallback plus `"error.fieldName"` overrides (dot notation for nested fields,
e.g. `"error.order.shipping.address.postalCode"`).
KosmoJS picks the most specific message; it appears in each entry's `message`.
[Details ›](/validation/error-handling.html#custom-error-messages)

#### Why must I avoid built-in type names?
Names like `Event`, `Response`, `Request`, `Error`, `Date`, `Partial`, `Record`, `Buffer`
are referenced as-is during type flattening, so the validator sees the built-in,
not your custom type - a silent runtime failure with no compile error.
Use a consistent `T` suffix/prefix (`EventT`, `TResponse`).
The full list is in the TFusion builtins reference.
[Details ›](/validation/naming-conventions.html#why-this-matters)

#### How do I skip runtime validation but keep types?
Per-target `runtimeValidation: false` in the second type argument (works for payload and response).
You then read the body via the bodyparser directly. Param validation cannot be skipped -
params are part of the URL structure. Use sparingly:
runtime validation is what catches mismatched DB responses, unexpected payloads, and API drift.
[Details ›](/validation/skip-validation)

### Type Safety

#### What type arguments does defineRoute accept?
RouteName (required), ParamsTuple, then State + Context (Koa) or Variables + Bindings (Hono).
The 3rd/4th are for types unique to one route.
[Details ›](/backend/type-safety.html#typing-state-context)

#### How do I type Cloudflare bindings (e.g. D1) in Hono?
The 4th type argument (`{ DB: D1Database }`) for a single route,
or `DefaultBindings` in `api/env.d.ts` globally; read via `ctx.env.DB`.
[Details ›](/backend/type-safety.html#typing-state-context)

#### How do I add global context/state types?
Declare them in `api/env.d.ts` via module augmentation: `DefaultState`/`DefaultContext` (Koa)
or `DefaultVariables`/`DefaultBindings` (Hono).
[Details ›](/backend/type-safety.html#global-context-types-apienvdts)

### Fetch Clients

#### How are fetch clients generated?
Automatically for every API route, derived from the same type definitions -
change the API and the client updates, no manual sync.
Output lands in `lib` alongside validators and the OpenAPI spec.
[Details ›](/fetch/intro)

#### How do I call a client?
`import fetchClients from "_/fetch"`, then `fetchClients["users/[id]"].GET([123])`.
[Details ›](/fetch/start.html#method-signatures)

#### What's the method signature?
First argument is a params array in path order; second is the optional payload
(`{ query }`, `{ json }`, etc.). Response type is inferred from your route's `response` definition.
[Details ›](/fetch/start.html#method-signatures)

#### How do I call a route with no params or no payload?
No params: call with no array (`fetchClients["users"].GET()`).
Payload but no params: pass `[]` for params (`GET([], { query: {...} })`).
If the route defines no payload, the second argument isn't required.
[Details ›](/fetch/start.html#routes-without-parameters-or-payloads)

#### Are requests validated before they leave the browser?
Yes - clients validate params and payload before any network request,
using the exact same TypeBox schemas as the server.
Invalid data throws immediately, no round trip.
[Details ›](/fetch/validation)

#### What are validationSchemas, and how do I use them in forms?
Each client exposes `validationSchemas` (`params`, `json.POST`, etc.) for real-time UI feedback.
Four methods: `check(data)` (cheap boolean, safe per keystroke), `errors(data)`
(field-level array, only after `check` fails), `errorMessage(data)` (one string),
`errorSummary(data)` (brief overview). Gate the heavy three behind `check`.
[Details ›](/fetch/validation.html#validation-schemas)

#### How do I do performant per-field validation as users type?
Schemas validate whole objects, so on a partially-filled form `check` fails
for *all* missing required fields, not just the one under test.
Fix: merge the field under test into a fully-valid placeholder payload
(`{ ...validPayload, name: e.target.value }`) so `check` only fails for that field.
On submit, always validate the real payload. Most forms don't need this -
it matters for complex forms validating in real time.
[Details ›](/fetch/validation.html#per-field-validation-performance)

#### How do I build URLs without making a request?
`path([123])` -> `/api/users/123`; `path([123], { query: { include: "posts" } })` adds a query string;
`href("https://api.example.com", [123])` builds an absolute URL.
Multiple params follow path order.
[Details ›](/fetch/validation)

#### How do I distinguish ValidationError from network errors on the client?
`import fetchMap, { ValidationError } from "_/fetch"`;
`error instanceof ValidationError` means data failed validation and no request was made
(it carries `target`/`errors`/`errorMessage`/`errorSummary`);
anything else is a network or server error.
[Details ›](/fetch/utilities)

#### How does it integrate with framework data patterns?
Clients return standard promises, so they drop into SolidJS `createResource`,
React hooks/`useEffect`, TanStack Query `queryFn`, etc.
Types flow through these abstractions automatically.
[Details ›](/fetch/error-handling)

### Frontend

#### Which frontend frameworks are supported?
React, SolidJS, Vue, and MDX - each with a dedicated generator bridging directory routing
to the framework's native router and reactive model.
[Details ›](/fetch/integration)

#### How do I enable a generator on an existing folder?
Register the generator (and its Vite plugin, e.g. `@vitejs/plugin-react` +
`reactGenerator()`) in the folder's `kosmo.config.ts`.
Restart the dev server after adding generators.
[Details ›](/frontend/intro.html#enabling-the-generator)

#### What `jsxImportSource` does each framework need?
React `"react"`, SolidJS `"solid-js"`, Vue `"vue"` (only when using JSX),
MDX `"preact"`. All use `jsx: "preserve"` (Vite does the JSX transform, not TS).
Mixing frameworks needs per-folder tsconfig - KosmoJS generates a `tsconfig.base.json`
per folder in `lib/` for your folder's `tsconfig.json` to extend.
[Details ›](/frontend/intro.html#typescript-configuration)

#### What foundation files does a framework generator produce?
A root App component (your app shell), a router config (`routerFactory`),
and a client entry point (`entry/client`). SSR adds a server entry.
[Details ›](/frontend/intro.html#enabling-the-generator)

#### What is routerFactory?
It wires your App + generated routes to the native router.
Its callback returns `clientRouter()` (browser navigation) and `serverRouter(url)` (SSR routing).
Generated routes are always wrapped inside your App, establishing the layout hierarchy,
and use the folder's `baseurl`.
[Details ›](/frontend/application.html#router-configuration)

#### What is renderFactory?
It orchestrates `mount()` (fresh client mount) vs `hydrate()` (hydrate SSR HTML),
choosing automatically via Vite's `import.meta.env.SSR`.
Referenced from `index.html` through `entry/client`.
[Details ›](/frontend/application.html#application-entry)

#### Are page components lazy-loaded?
Yes - all page components are lazy-loaded by default and fetched on demand,
keeping the initial bundle small. The generated route shape differs slightly
per framework's router format.
[Details ›](/frontend/routing.html#lazy-loading)

### Layouts

#### How do layout files work?
A `layout` file in any `pages/` folder wraps every route in that folder and its subfolders;
nest layouts by nesting folders. No imports or config - the file system defines the hierarchy,
and child routes cannot escape parent layouts.
[Details ›](/frontend/layouts.html#define-a-layout)

#### What's the nested render order?
Outermost App -> each layout in path order -> the page. E.g. for `/dashboard/settings/profile`:
`App` -> `dashboard/layout` -> `dashboard/settings/layout` -> page.
[Details ›](/frontend/layouts.html#define-a-layout)

#### What's the recognized layout filename per framework, and is it case-sensitive?
`layout.tsx` (React/SolidJS), `layout.vue` (Vue), `layout.mdx` (MDX) - lowercase only.
Other casings are treated as regular components.
Each folder runs one framework and ignores other frameworks' files (a Vue folder ignores `.tsx`, etc.).
[Details ›](/frontend/layouts.html#layout-file-naming)

#### What does the root App file wrap, and how is it different from a layout?
`App.{tsx,vue,mdx}` at the source-folder root wraps every route -
the place for truly global concerns (auth checks, analytics, error boundaries).
A `layout` file scopes shared UI to a folder subtree.
[Details ›](/frontend/layouts.html#global-layout-via-app-file)

#### How does each framework render the child route?
React `<Outlet/>`, Vue `<RouterView/>`, SolidJS and MDX `props.children`.
[Details ›](/frontend/layouts.html#layout-implementation)

#### How do I load data in a layout?
Same per-framework patterns as pages: React `loader` + `useLoaderData`,
SolidJS `preload` + `createAsync`, Vue `onMounted`/guards.
Load shared data at the common parent layout rather than duplicating the fetch in each child.
[Details ›](/frontend/layouts.html#data-loading-in-layouts)

### Navigation (typed Link)

#### How does the typed Link component work?
The generator produces a `Link` at `components/Link.{tsx,vue}` with compile-time route validation.
The `to` prop takes a typed tuple `[routeName, ...params]` (e.g. `["users/[id]", 123]`),
plus an optional `query` prop. Typing the route name triggers IntelliSense;
parameterized routes require their params.
[Details ›](/frontend/link-navigation.html#usage)

#### What's the refactor-safety benefit?
Renaming a route directory produces TypeScript errors at every `Link` referencing the old name -
turning refactors into an automated checklist.
[Details ›](/frontend/link-navigation.html#linkprops-type)

### Data Preload

#### How does route-level preloading work per framework?

- React: `export { GET as loader }` - React Router calls it before render;
`useLoaderData<ResponseT[...]>()` retrieves the typed result with no duplicate request
(runs on load, hover, navigation).

- SolidJS: `export { GET as preload }` - called on hover/intent;
`createAsync(preload)` reuses the cached result.

- Vue: no built-in route-level preload hook - use `onMounted`, `watch` on params,
or navigation guards in `router.ts`.

[Details ›](/frontend/data-preload.html#page-integration)

#### Why does Vue behave differently for preloading?
Vue Router has no built-in route-level preload mechanism,
so KosmoJS can't offer the same loader/preload ergonomics.
This is a property of Vue Router, not a KosmoJS limitation;
prefetching support is under consideration.
[Details ›](/frontend/data-preload.html#how-it-works)

### MDX

#### When should I use MDX over React/Vue/Solid?
MDX for content-primary folders (documentation, blogs, marketing) -
rendered to static HTML with Preact, minimal client JS by default.
React/Vue/Solid for interactivity-primary folders (dashboards, client-side state, real-time forms).
Rule of thumb: primarily content with occasional interactivity -> MDX;
primarily interactive with occasional content -> a framework.
[Details ›](/frontend/mdx.html#when-to-use-mdx-vs-frameworks)

#### How do I write MDX pages?
`.mdx`/`.md` files in `pages/`, mixing markdown and JSX, with YAML frontmatter between `---` fences.
Import Preact components directly.
[Details ›](/frontend/mdx.html#writing-pages)

#### How do I access the current route inside a component?
Call the `useRoute()` hook from `_/use`. It returns the route `name`, the validated `params`,
and the page's `frontmatter` together, so a shared component (a breadcrumb, a title bar) can
read where it is without receiving props from the page. This is distinct from a framework's
own `useParams` - `useRoute()` also carries the route name and frontmatter, not just params.
[Details ›](/frontend/mdx.html#route-parameters)

#### Why can't I write TypeScript in MDX?
MDX only supports plain JavaScript expressions.
Keep typed code (props, hooks, types) in `.tsx` files and import them into the MDX page.
[Details ›](/frontend/mdx.html#common-pitfalls)

#### How do I override markdown elements globally?
The component map in `components/mdx.tsx` (applied through `MDXProvider`) -
override `h1`, `pre`, links, etc. for all pages. Individual pages can still import additional components.
[Details ›](/frontend/mdx.html#using-components)

#### How does frontmatter drive the head?
`title`, `description`, and a `head` array in frontmatter inject `<head>` content automatically -
the same convention as VitePress, no new syntax.
[Details ›](/frontend/mdx.html#frontmatter-head-injection)

#### How does SSG handle dynamic routes?
Declare variants via `staticParams` in frontmatter; the build renders one HTML file per entry.
Static routes render automatically.
Dynamic routes without `staticParams` are skipped from the SSG build entirely.
[Details ›](/frontend/mdx.html#static-site-generation)

#### What are the common MDX pitfalls?
No TypeScript in MDX (keep it in `.tsx`); hooks must be called inside components,
not at module scope (`export const x = useParams()` runs on import and fails);
curly braces in prose are parsed as JSX - wrap in backticks;
layouts must be `.mdx` not `.md` (`.md` can't render `{props.children}`).
[Details ›](/frontend/mdx.html#common-pitfalls)

### SSR

#### Is SSR on by default?
No - folders default to client-side rendering (with Vite's dev server and HMR on dev).
Enable SSR per folder via `--ssr` at creation or by registering `ssrGenerator()`
in `kosmo.config.ts` (restart dev after adding).
[Details ›](/frontend/server-side-render.html#adding-ssr-support)

#### Does SSR run in dev?
No - in dev, Vite handles all requests with HMR and CSR for immediate feedback.
SSR activates exclusively in production builds.
(This commonly surprises Next/TanStack migrators who expect dev to mirror prod rendering.)
[Details ›](/frontend/server-side-render.html#development-experience)

#### renderToString vs renderToStream?
`renderToString(url, SSROptions)` renders the full page before sending and returns `{ html, head }`
(provided by default). `renderToStream` enables progressive streaming for better TTFB
and takes precedence when both are present.
[Details ›](/frontend/server-side-render.html#server-entry-point)

#### What does renderToString receive?
The requested URL plus `SSROptions`:
`template` (client `index.html` with `<!--app-head-->`/`<!--app-html-->` placeholders),
`manifest` (Vite's dependency graph),
and `assets` (SSR assets you inject manually, each offering `tag`/`path`/`content`/`size`).
[Details ›](/frontend/server-side-render.html#render-factory-arguments)

#### Why must I inject SSR assets manually but not CSR assets?
Vite injects CSR assets automatically; SSR-related assets are not,
so the server entry composes them into `head` itself (e.g. `assets.map(a => a.tag).join("\n")`).
[Details ›](/frontend/server-side-render.html#render-factory-arguments)

#### How does streaming work across runtimes?
Frameworks expose a web-standard `ReadableStream`
(`renderToReadableStream`, `renderToStream().readable`, `renderToWebStream`)
that pipes directly into Hono's `stream.pipe()` - no Node stream adapters, identical on Node/Bun/Deno.
Split the template at `<!--app-html-->`, write the head, pipe the framework stream, write the tail.
[Details ›](/frontend/server-side-render.html#stream-rendering)

#### How do I build and run the SSR bundle, and on which runtimes?
`pnpm build` produces `dist/<folder>/ssr/server.js`. Run it with `node`, `bun`,
or `deno run -A` (`... -p 4556`). Unix sockets are supported across all three (`-s /tmp/app.sock`).
It uses `node:http`, natively supported by all three runtimes.
[Details ›](/frontend/server-side-render.html#runtime)

#### How do I disable in-memory static asset serving?
`ssrGenerator({ serveStaticAssets: false })` when running behind a reverse proxy or CDN.
[Details ›](/frontend/server-side-render.html#static-asset-handling)

#### How do I deploy behind Nginx/Caddy?
Reverse-proxy to the SSR port (or a Unix socket). The API and SSR servers are bundled separately,
so deploy, scale, and run them independently.
[Details ›](/frontend/server-side-render.html#production-deployment)

#### What breaks during SSR?
Browser APIs (`window`, `document`, browser-only APIs) are unavailable server-side.
Coordinate async data so it's ready before render, plan state serialization for hydration,
and remember the hydration bundle still ships to clients (size still matters).
Use error boundaries so a server error doesn't terminate the process.
[Details ›](/frontend/server-side-render.html#technical-considerations)

### Build & Deployment

#### How do I build all folders vs one?
`pnpm build` (all) or `pnpm build front` (one).
[Details ›](/backend/building-for-production)

#### What's the build output layout?
`dist/<folder>/` with `api/` (`app.js` factory + `server.js` bundled server),
`client/` (`assets/` + `index.html`), and `ssr/` (`app.js` + `server.js`, only when SSR is enabled).
[Details ›](/backend/building-for-production.html#build-output)

#### What's the simplest way to run the API in production?
`node dist/front/api/server.js`. For more control, use the app factory at `dist/<folder>/api/app.js`.
[Details ›](/backend/building-for-production.html#running-in-production)

#### How do I mount the app factory per runtime?
Koa: `app.callback()` is a Node `(req,res)` handler -
on Deno/Bun use it via the `node:http` compat layer (`createServer(app.callback())`),
not their native serve APIs. Hono: `app.fetch` is a Web Fetch handler -
Node via `@hono/node-server`'s `getRequestListener`, Deno via `Deno.serve`, Bun via `Bun.serve`.
[Details ›](/backend/building-for-production.html#running-in-production)

#### Why are the API and SSR servers separate?
They're bundled separately so you can deploy, scale, and run them independently.
[Details ›](/backend/building-for-production.html#build-output)

### OpenAPI

#### Does it auto-generate OpenAPI?
Yes - OpenAPI 3.1 directly from route definitions, TypeScript types, `VRefine` constraints,
parameters, and responses. No manual schema authoring or annotation layers.
[Details ›](/openapi)

#### How do I enable and configure it?
Add `openapiGenerator(config)` in `kosmo.config.ts`. Required: `outfile`, `openapi` (e.g. `"3.1.0"`),
`info` (`title` + `version`), `servers` (each `url` + optional `description`).
Optional `info`: `summary`, `description` (markdown), `termsOfService`, `contact`, `license`.
[Details ›](/openapi.html#configuration)

#### Why does one route with an optional param produce two paths?
OpenAPI requires all path params to be mandatory, so a route like `users/[id]/posts/{postId}`
emits both `/users/{id}/posts/{postId}` and `/users/{id}/posts` -
both referencing the same handlers and schemas.
[Details ›](/openapi.html#generated-specification)

#### Does the spec regenerate automatically?
Yes - it regenerates in the background whenever you change routes, types, or schemas,
alongside the validation and fetch generators.
[Details ›](/openapi.html#generated-specification)

#### How do I serve the spec?
Point Swagger UI, Redoc, or Stoplight Elements at the generated file.
[Details ›](/openapi.html#generated-specification)

### Dev Workflow & Internals

#### What happens when the dev server starts?
Vite compiles `api/app.ts`; the dev server serves both client pages and your API routes;
requests are routed between Vite and your API; a file watcher monitors API files for changes.
[Details ›](/backend/development-workflow.html#what-happens-on-start)

#### What are the api/dev.ts hooks?
`requestHandler` (returns the API request handler), `requestMatcher`
(which requests go to the API vs Vite - by default, requests whose URL starts with the
`apiurl` prefix or that carry an `x-api-request: true` header),
and `teardownHandler` (runs before each API reload).
[Details ›](/backend/development-workflow.html#api-dev-ts)

#### How do I add custom request routing (e.g. WebSockets)?
Override `requestHandler` in `api/dev.ts` for custom dispatch, WebSocket handling,
multi-handler setups, etc.
[Details ›](/backend/development-workflow.html#apidevts)

#### Why are my DB connections leaking during development?
Frequent rebuilds can exhaust connections. Close connections and release resources
in `teardownHandler`, which runs before each reload.
[Details ›](/backend/development-workflow.html#apidevts)

#### How do I inspect registered routes and their middleware?
Each route has a `debug` property; enable with `DEBUG=api pnpm dev` to print path,
methods, middleware chain (by slot), and handler.
Targeted properties: `debug.headline`, `debug.methods`, `debug.middleware`, `debug.handler`.
[Details ›](/backend/development-workflow.html#inspecting-routes)

#### Why should I name my middleware functions?
Named functions print by name in the debug output; anonymous ones print only their first line,
which is much harder to read.
[Details ›](/backend/development-workflow.html#inspecting-routes)

#### How does validation generation performance scale?
With type complexity - simple routes are near-instant, deep hierarchies with many dependencies
take a few seconds. Generation runs in parallel with the Vite dev server and is cached per file,
so schemas regenerate only when the route file or a type dependency changes.
By the time you switch to the browser, the schema is ready.
[Details ›](/validation/performance)

#### When does a slow full rebuild happen?
Deleting the `lib` folder manually, or a KosmoJS update bumping the cache version.
On large projects this can take minutes - the same category as clearing `node_modules`
or regenerating a Prisma client, not part of the normal edit-test cycle.
[Details ›](/validation/performance.html#when-it-becomes-noticeable)

#### How does this compare to Zod/Yup on performance vs maintenance?
Zod/Yup have zero generation overhead because you hand-write the schemas -
eliminating generation time but adding ongoing maintenance and drift risk.
KosmoJS trades a few seconds of machine time for eliminating that manual work entirely.
[Details ›](/validation/performance.html#machine-time-vs-human-time)

#### Where does generated code live?
In `lib`, kept out of your source directories and bundled like any other dependency
at production build time. Treat it as a build artifact - you don't need to read it.
[Details ›](/validation/intro.html#how-generation-works)

### Mental Model & Positioning

#### What is KosmoJS the equivalent of?
A meta-framework that owns routing conventions, the validation pipeline, middleware composition,
dev workflow, and build orchestration - while you keep control of backend, frontend,
state, styling, database, and deploy target.
[Details ›](/about)

#### Is it full-stack like Next, or just router + build orchestrator?
Both sides, but with an explicit client/server boundary rather than a unified Server Components model.
You get directory routing for `api/` and `pages/`, plus typed validation, generated fetch clients,
OpenAPI, opt-in SSR, and build orchestration.
[Details ›](/features)

#### Does it pick a frontend for me like Next?
No - you choose React, Vue, SolidJS, or MDX per source folder, and can mix them across folders.
[Details ›](/frontend/intro)

#### Can I use React?
Yes. React is a first-class generator alongside Vue, SolidJS, and MDX,
and React folders use React Router (`Outlet`, `useLoaderData`, `useParams`).
[Details ›](/frontend/intro)

#### How does it compare to TanStack's "bring your own everything"?
Similar spirit on the app layer - unopinionated about state/styling/data libraries -
but it adds conventions for routing, validation, and build that TanStack leaves to you,
and it enforces type safety at runtime (generated validators), not only at compile time.
[Details ›](/about)

#### Is it opinionated about state/styling/data fetching?
No - you keep full control. KosmoJS handles infrastructure, not your app stack.
[Details ›](/about)

#### Does it own deployment like Next/Vercel?
No platform lock-in. It's a standard Node/Vite app -
deploy the bundled servers to Node/Bun/Deno/edge yourself.
You can still deploy to Vercel as a Node app, but there are no Vercel-specific features
(and no dependence on them).
[Details ›](/backend/building-for-production.html#running-in-production)

#### What does it give me over Vite + React Router + Hono wired by hand?
Directory routing for both sides, generated runtime validators from TS types,
generated typed fetch clients, automatic OpenAPI, multi-folder orchestration,
and per-folder build/deploy - without the DIY glue that becomes load-bearing.
[Details ›](/features)

#### Is it a meta-framework or monorepo tooling?
A meta-framework using source folders - monorepo structure and independence without workspaces,
package boundaries, internal dependency graphs, or build-cache configs.
[Details ›](/about)

### Routing

#### What's the equivalent of Next's `app/page.tsx`?
A folder with an `index` file: `pages/users/[id]/index.tsx` -> `/users/:id`.
(TanStack file-based plugin users: same idea, folder-driven.)
[Details ›](/routing/intro.html#how-it-works)

#### Why folders-with-`index` instead of `page.tsx`?
Only `index` is the route; siblings are colocated helpers - unambiguous at scale.
[Details ›](/routing/rationale)

#### How do params map to Next's / TanStack's?

- `[id]` <-> Next `[id]` / TanStack `$id` (required)
- `{id}` <-> optional
- `{...path}` <-> Next `[...slug]` (splat/catch-all)

Different sigils, same concepts.
[Details ›](/routing/params)

#### Catch-all / optional catch-all (`[[...slug]]`)?
Splat `{...path}` covers both. It matches any number of segments including zero,
so it behaves like Next's optional catch-all `[[...slug]]` - `docs/{...path}` matches `/docs`
as well as `/docs/a/b/c`. There's no separate required-vs-optional catch-all distinction to manage.
[Details ›](/routing/params.html#splat-parameters)

#### Type-safe params like TanStack Router?
Yes - refine params via the inline tuple type arg to `defineRoute`;
`ctx.validated.params` carries the refined type, validated at runtime
(stronger than TanStack's compile-time-only route typing,
which doesn't validate request bodies by itself).
[Details ›](/backend/type-safety.html#typing-params)

#### Where's the central route tree (TanStack `routeTree.gen.ts`) / route config object?
There isn't one you register. Routing is filesystem-driven;
route configs are generated per source folder into `lib/` for the native router to consume.
Treat generated code as a build artifact.
[Details ›](/frontend/routing.html#generated-route-shape)

#### Route groups like Next's `(group)`?
There's no route-group syntax, and it isn't needed. Next's `(group)` is a lightweight way
to organize routes without affecting the URL - a workaround for separating concerns inside one app.
KosmoJS separates concerns at a higher level: source folders are independent apps
with their own framework, base URL, middleware, and build,
so the separation route groups gesture at is structural here, not a naming convention.
[Details ›](/routing/intro)

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
[Details ›](/routing/intro)

#### Nested layouts vs Next `layout.tsx` / TanStack `_layout`?
Same idea - a `layout` file wraps its folder and subfolders, nesting by folders,
rendered outward-in via `<Outlet/>` (React), `<RouterView/>` (Vue), or `props.children` (Solid/MDX).
[Details ›](/frontend/layouts.html#define-a-layout)

#### Do layouts persist state across navigation like App Router?
Yes, in the normal case. When you navigate between sibling routes under the same layout,
only the child swaps in - the layout component stays mounted,
so it doesn't re-render and its state is preserved.
This is the standard behavior of the underlying routers (React Router, Vue Router, Solid Router)
that KosmoJS registers routes with. A layout only remounts when navigation moves outside its subtree.
[Details ›](/frontend/layouts)

#### `loading.tsx` / `error.tsx` / `not-found.tsx`?
There are no per-route special files for these, because they're handled with each framework's
own primitives rather than a KosmoJS file convention.
Global loading, suspense, and error boundaries live at the `App.{tsx,vue}` level,
using the native principles of your chosen framework.

Not-found has a built-in: a `pages/404.{tsx,vue}` component is rendered for unmatched routes.
Backend errors are separate - they centralize in `api/errors.ts`.
[Details ›](/frontend/layouts.html#global-layout-via-app-file)

#### `beforeLoad` / search-param validation hook?
KosmoJS doesn't add a proprietary `beforeLoad`-style hook - it leaves your framework's
primitives untouched, so you use the native pattern directly:

- React Router's `loader`
- Solid Router's `preload`
- Vue Router's navigation guards run before the route renders
and are the place for pre-load checks and redirects.

For the data contract itself, search params are validated via the `query` target
on handlers (with VRefine constraints) and surfaced through the generated,
client-side-validating fetch clients.
[Details ›](/frontend/data-preload.html#page-integration)

#### Typed/validated search params like TanStack search schemas?
Not implemented yet - it's a considered feature.
KosmoJS validates query params on the API contract
(the `query` target gives full types and constraints, surfaced through the fetch clients),
but there's no router-level `validateSearch` that types `useSearch()` on the *page route*
the way TanStack does - query typing centers on the API/fetch boundary,
not page-route search state. For now, read and parse search params with your framework's native router.
[Details ›](/validation/payload.html#validation-targets)

### Data Fetching

#### React Server Components / `"use server"` boundary?
No RSC, and no `"use client"`/`"use server"` directive boundary - by design, not omission.
KosmoJS keeps the battle-tested industry standard: server code in `api/`,
client code in `pages/`, and a plain HTTP API between them with typed fetch clients across the wire.
There's no interleaving of server and client code in one file and no new mental model to learn -
the boundary is the network call. Boring, as in 2015 - and boring is a feature here.
[Details ›](/frontend/intro)

#### Can a page fetch from the database server-side without an API hop?
Not the RSC way. SSR renders your client components server-side,
but data still flows through the API layer / fetch clients.
The de-facto model is API routes + generated clients + framework loader/preload.
[Details ›](/frontend/data-preload)

#### Loaders like TanStack Start/Router?
Yes for React (`loader`) and SolidJS (`preload`); Vue uses `onMounted`/guards.
The loader is simply your generated fetch client's method exported as `loader`/`preload`,
so the typed response flows into `useLoaderData`/`createAsync`.
[Details ›](/frontend/data-preload.html#page-integration)

#### Is there loader caching / staleness / `loaderDeps`?
No built-in loader cache - React/Solid reuse the in-flight/cached result for that navigation;
SolidJS `preload` results are cached/reused by `createAsync`. For real caching, bring TanStack Query.
[Details ›](/frontend/data-preload.html#how-it-works)

#### Where does TanStack Query fit?
*Not a bundled dependency*, but fetch clients return plain promises,
so Query slots in cleanly as your cache/mutation layer:
`queryFn: () => fetchClients["users/[id]"].GET([id])`, `mutationFn` for mutations,
`queryClient.invalidateQueries` after. The typed response flows into Query's generics.
Put `QueryClientProvider` in your root App wrapper. There's no generated Query-options helper -
you wire `queryKey`/`queryFn` yourself.
[Details ›](/fetch/integration)

#### Does SSR + Query hydration work?
Possible, but it's on you - wire dehydrate/hydrate in the SSR entry.
KosmoJS doesn't bundle Query SSR plumbing.
[Details ›](/frontend/server-side-render.html#technical-considerations)

#### fetch caching / `revalidatePath` / `revalidateTag` / ISR?
No fetch cache extensions, no tag/path revalidation, no ISR. Cache at the CDN/proxy layer;
MDX SSG is full static generation. After a mutation, refetch or invalidate your own client cache
(e.g. via Query).
[Details ›](/openapi)

#### Preload on link hover/intent - which frameworks?
React `loader` runs on load/hover/navigation; SolidJS `preload` runs on hover/intent
(cached by `createAsync`); Vue requires manual guards.
Loader (React) and preload (SolidJS) make data ready before render, eliminating route-level spinners.
[Details ›](/frontend/data-preload.html#how-it-works)

### Server Actions / Mutations / RPC

#### Server Actions (`"use server"`) / Start server functions (`createServerFn`)?
No server actions and no RPC-style server functions.
Do mutations by defining a normal API route (`POST`/`PUT`/`DELETE`)
and calling its generated typed client, validated client-side first.
(There's no progressive-enhancement no-JS form submit as a first-class feature,
and no `useFormState`/`useActionState` equivalent -
use your framework's form state plus the client's `validationSchemas` for field errors.)
[Details ›](/fetch/start.html#method-signatures)

#### End-to-end RPC type safety like tRPC?
Effectively yes via generated clients - params, payload,
and response types derive from the same route definition,
with client-side validation before the request.
The difference: it's route-based (path keys + HTTP methods) rather than procedure-based,
and backed by generated TypeBox validators plus automatic OpenAPI.
[Details ›](/fetch/intro)

#### Client-side input validation like a tRPC input schema?
Yes - the client validates params/payload before sending, using the same server schemas,
so client-valid and server-accepted stay in sync.
[Details ›](/fetch/validation.html#validation-schemas)

### Backend / API

#### Next Route Handlers (`route.ts`) / Start `createAPIFileRoute` equivalent?
`defineRoute` returning an array of method handlers in `api/.../index.ts` - same idea,
plus validation and a generated client for free. You don't write `Response.json()`;
use Koa `ctx.body` or Hono `ctx.json()`. There's no `NextRequest`/`NextResponse` -
it's the native Koa/Hono context extended with `ctx.bodyparser` and `ctx.validated`.
[Details ›](/backend/intro.html#defining-endpoints)

#### Why an array instead of named method exports?
The factory yields method builders + `use`; returning an array lets you compose middleware
and methods together with shared types.
[Details ›](/backend/intro.html#defining-endpoints)

#### Run on the edge / Cloudflare / Deno / Bun?
With Hono the API runs on Node/Deno/Bun/Cloudflare Workers and edge platforms unchanged (`app.fetch`).
Koa runs via the `node:http` compat layer. There's no automatic serverless/edge function
packaging like Next - you run the bundled server or wire `app.fetch` into an edge runtime yourself.
[Details ›](/backend/building-for-production.html#running-in-production)

#### Edge middleware (`middleware.ts`) vs cascading `use.ts`?
There's no global edge-middleware file or client-route interception layer.
API middleware is per-subtree via auto-wrapping `use.ts` plus slots;
to gate a subtree behind auth, drop a `use.ts` in its folder (typed context via `UseT`).
For the client side, use the global `App.*` wrapper or a layout.
[Details ›](/backend/cascading-middleware.html#how-it-works)

#### Bring Hono ecosystem middleware?
Yes - e.g. `hono-rate-limiter` is shown wired through `use`.
There's no bundled auth (no NextAuth integration) - wire your own in middleware:
verify token, set `ctx.state.user` / `ctx.set("user")`.
[Details ›](/backend/cascading-middleware.html#common-use-cases)

#### Typed env/bindings (e.g. D1)?
Hono bindings are typed via `defineRoute`'s 4th type arg or `DefaultBindings` in `api/env.d.ts`
(e.g. `DB: D1Database`), read via `ctx.env.DB`.
[Details ›](/backend/type-safety.html#typing-state-context)

### Validation & Types

#### Does it use Zod like TanStack often does?
No - "runtype" validation: TS types -> JSON Schema -> TypeBox validators, generated automatically.
You write TS types once; validators are generated, eliminating hand-written schemas
and type/schema drift. One source of truth drives compile-time types, runtime validation,
client validation, and OpenAPI.
[Details ›](/validation/intro.html#understanding-runtype-validation)

#### Do I lose flexibility without Zod?
Constraints come via `VRefine` (JSON Schema keywords like `minLength`, `pattern`,
`format`, `minimum`, `multipleOf`, `minItems`);
for trusted endpoints set `runtimeValidation: false` to keep types only.
The generated fetch clients validate with the exact server schemas,
so client and server stay in sync with nothing to keep aligned by hand.
[Details ›](/validation/skip-validation)

#### Is type safety runtime-enforced or compile-only?
Both - the same TS type drives compile-time checks and generated runtime validators.
This is stronger than TanStack's compile-time route typing,
which doesn't validate request bodies on its own.
[Details ›](/validation/intro.html#understanding-runtype-validation)

#### Why is there a codegen/generation step at all?
Validators are AOT-compiled from types (TanStack users used to instant route typing
should expect a brief generation pass, cached per file, running alongside Vite).
A slow full rebuild only happens when you delete `lib/` or a cache-version bump occurs -
akin to regenerating `routeTree.gen.ts` from scratch, but heavier.
Treat generated code as a black box, like the generated route tree.
[Details ›](/validation/performance.html#machine-time-vs-human-time)

### Rendering & SSR

#### Is KosmoJS CSR-first, and how do I enable SSR?
Yes - folders default to CSR with Vite's dev server and HMR.
Opt into SSR via `ssrGenerator()` (or `--ssr` at creation). SSR runs in production builds, not dev.
There are no per-route rendering directives like `dynamic`/`force-static` -
the SSR-vs-CSR split is per source folder (e.g. an SSR marketing folder + a CSR app folder).
[Details ›](/frontend/server-side-render.html#adding-ssr-support)

#### ISR / on-demand revalidation / PPR?
No ISR/revalidation and no partial prerendering.
[Details ›](/frontend/server-side-render)

#### SSG / static export vs `output: export`?
MDX folders support SSG, rendering each route to static HTML (`staticParams` for dynamic routes)
- purpose-built for docs/blog/marketing with frontmatter-driven head, layouts, and typed nav.
Comparable to Next + MDX/Contentlayer but built in.
[Details ›](/frontend/mdx.html#static-site-generation)

#### Streaming SSR vs Next + Suspense?
`renderToStream` streams via a web `ReadableStream` piped through Hono, improving TTFB;
it takes precedence over `renderToString`.
This streams HTML progressively rather than doing selective/island hydration.
[Details ›](/frontend/server-side-render.html#stream-rendering)

#### Islands / partial hydration?
Not offered as a named feature. MDX delivers minimal client JS by default and hydrates;
React/Solid/Vue hydrate the app via `renderFactory`.
[Details ›](/frontend/server-side-render)

#### `metadata` / `generateMetadata` / `<head>` management?
MDX frontmatter drives `<head>` (title/description/head array);
for app frameworks you set head in the SSR entry's returned `head` and in components.
No `metadata` export convention.
[Details ›](/frontend/mdx.html#frontmatter-head-injection)

### Project Structure, Tooling & Config

#### Different framework per folder, sharing types without `packages/shared`?
Yes - e.g. MDX marketing, React app, Vue admin in one project,
importing types directly across folders with no publishing or workspace protocols.
Folders develop and deploy independently while sharing infrastructure.
[Details ›](/features)

#### Is Vite exposed/configurable? What replaces `next.config.js`?
It's built on Vite (no proprietary runtime/bundler).
Configure per folder via `kosmo.config.ts` with `plugins` and `generators` arrays,
plus standard Vite config. There's no `app/` vs `pages/` debate - you're in `src/<folder>/{api,pages}`.
[Details ›](/frontend/intro)

#### Output vs `.next/`, and a `next start` equivalent?
`dist/<folder>/` with `api/`, `client/`, and `ssr/`.
Run the bundled server: `node dist/front/api/server.js` (API)
or `node dist/front/ssr/server.js -p 4556` (SSR). No adapter system - Koa via `node:http`,
Hono via native runtime servers.
[Details ›](/backend/building-for-production.html#build-output)

#### `next/image` / `next/font` / `next/link` / `next/head` equivalents?
A generated typed `Link` exists. Head injection is via MDX frontmatter and the SSR `head`.
There's no `next/image` (image optimization) or `next/font` equivalent - bring your own.
[Details ›](/frontend/link-navigation)

#### Vs Next multi-zone?
The source-folder model is the multi-app story: per-folder base URLs, frameworks,
and builds within one project, sharing types and a database layer -
so where Next stitches separate deployments together with multi-zone,
KosmoJS keeps the apps in one codebase with no zone configuration.
[Details ›](/features)

### OpenAPI

#### Does it really auto-generate OpenAPI, and how does it compare to hand-written / tRPC-OpenAPI?
Yes - OpenAPI 3.1 from routes, types, VRefine constraints, params, and responses,
with no manual authoring, kept live as routes change (TanStack has no built-in equivalent).
Serve it with Swagger UI, Redoc, or Stoplight Elements.
[Details ›](/openapi)

---

### Agents

An LLM agent must answer these before emitting KosmoJS code that compiles and runs.

#### A1. Which backend is this folder - Koa or Hono?
Check the folder's `kosmo.config.ts`: a `koaGenerator()` or `honoGenerator()`
in the `generators` array tells you which backend is in use.
It matters because the handler context API differs fundamentally:
body (`ctx.body =` vs `ctx.json()`), params (`ctx.params` vs `ctx.req.param()`),
state (`ctx.state.x` vs `ctx.set("x")`/`ctx.get("x")`),
and error model (bubbling try-catch vs `app.onError()`).
Koa bubbles errors up through middleware try-catch and responds by mutating `ctx.body`/`ctx.status`;
Hono catches everything in `app.onError()` and responds by returning a `Response`.
Guessing wrong produces code that won't run.

#### A2. Which frontend framework is this folder - React, SolidJS, Vue, or MDX?
Check the folder's `kosmo.config.ts` for the framework generator
(`reactGenerator()`, `solidGenerator()`, `vueGenerator()`, or `mdxGenerator()`),
or look at the page file extensions (`.tsx`/`.vue`/`.mdx`).
It matters because data preload (React `loader`+`useLoaderData`,
SolidJS `preload`+`createAsync`, Vue `onMounted`/guards),
child rendering (React `<Outlet/>`, Vue `<RouterView/>`, Solid/MDX `props.children`),
entry wiring, layout filename (`layout.tsx`/`.vue`/`.mdx`),
`jsxImportSource` (`react`/`solid-js`/`vue`/`preact`),
and mixed-segment support (full for Vue/MDX, `.ext`-only for React, none for SolidJS) all differ.

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

#### A11. Where is the latest authoritative source?
Always prefer fetching `https://kosmojs.dev/llms-full.txt` over memory for exact generator option names,
the full VRefine keyword set, and exact scaffold flags -
the conventions are dense and easy to get subtly wrong.
Every answer above links to its source documentation page for the authoritative detail.
