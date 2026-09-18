---
title: Notes for LLM Agents
description: What an LLM agent must check before emitting KosmoJS code - which framework the folder runs,
    who writes the boilerplate, the four validation mistakes that typecheck but fail at runtime,
    middleware placement, and why the dev server never shows the SSR path.
head:
  - - meta
    - name: keywords
      content: llm agent, ai coding agent, kosmojs for agents, codegen rules, agent checklist,
        silent validation failure, builtin type collision, literal brackets, boilerplate seeding,
        llms.txt, llms-full.txt, cursor, copilot, claude code
---

This page is for **LLM agents** writing KosmoJS code.

::: tip Prefer the source over memory
Fetch **`https://kosmojs.dev/llms-full.txt`** before relying on recall for details.
:::

::: warning Where to read
**For anything framework-specific, read the per-framework page - not the general docs.**

General pages present multi-framework snippets in tabs, which scrapers and retrieval routinely glue together or misattribute.

The rule is simple: for any generic matter, use snippets from the general pages;
for anything framework-specific - handlers, middleware, entries, data loading, error handling -
use the `agents/<framework>` page, the complete, self-contained surface of that framework with no other framework's code on it:
[Hono](/agents/hono.md) · [H3](/agents/h3.md) · [Koa](/agents/koa.md) ·
[React](/agents/react.md) · [Solid](/agents/solid.md) · [Vue](/agents/vue.md) ·
[Svelte](/agents/svelte.md) · [MDX](/agents/mdx.md)

**Read `.md`, never scrape `.html`.** Every page is served both ways - append `.md` to any page URL to get the markdown source.
:::

## Orient before writing

A source folder is a self-contained app, and almost every convention depends on which frameworks it runs.
Read `src/<folder>/kosmo.config.ts` first - the `frontend` and `backend` blocks are the answer:

| Question | Where to look |
|---|---|
| Which backend? | `backend.stack` - `"hono"` / `"h3"` / `"koa"`. No `backend` block -> frontend-only folder, no `api/` directory. |
| Which frontend? | `frontend.stack` - `"react"` / `"solid"` / `"vue"` / `"svelte"` / `"mdx"`, or the page file extensions. No `frontend` block -> backend-only folder, no `pages/`. |
| SSR? SSG? | `frontend.ssr` / `frontend.ssg`. |
| Where does it serve from? | `frontend.base` and `backend.base` - both full paths, not joined. |

The frontend answer decides more than syntax - data preload, child rendering, layout filenames,
`jsxImportSource` and mixed-segment support all differ per framework.
Consult the [support matrix](/essentials/frameworks.md) rather than guessing from one example.

**Route or page?** An API route default-exports `defineRoute(...)` returning an array of method handlers.
A page default-exports a component - a **named function**, never an anonymous arrow, which breaks Vite's HMR.

## Never write the boilerplate yourself

When a new route, `use.ts`, page or layout is needed: **create the file empty** and let KosmoJS fill it in.
Imports, factory signatures and seeded-file wiring change between releases,
so recalled boilerplate is the single most likely thing to be wrong.

KosmoJS owns the seeding; you own the logic you put inside it.

Two ways to land it:

- **Local machine** - the running dev server picks the file up on creation and fills it in.
- **Containers, CI, remote sandboxes** - do **not** rely on the dev server.
File watching inside containers is prone to inotify trouble (limits, wedged instances, lost events),
which shows up as files that are silently never filled. Create the empty files and run the **build** command instead:
it resolves routes with exactly the same code, deterministically, with no watcher involved.

## The four silent validation failures

These typecheck cleanly and misbehave at runtime. Check them before debugging anything else.
[Full list&nbsp;›](/validation/gotchas.md)

**1. A wrapping bracket hidden behind an alias.** The params tuple, the response tuple and the
`VRefine` constraint object must each have their `[]` / `{}` written **inline**:

```ts
defineRoute<"users/[id]", [number]>      // ✅
type Params = [number];
defineRoute<"users/[id]", Params>        // ❌ brackets hidden
```

Aliases *inside* the brackets are fine - it is the brackets themselves that are read from source.
Hide them and a params tuple rejects **every** request, while a response tuple produces **no schema at all**.

**2. A type named after a built-in.** `Event`, `Response`, `Request`, `Error`, `Date`, `Partial`,
`Record`, `Buffer` and friends are referenced as-is during type flattening,
so the validator sees the built-in instead of your type - no compile error, wrong behaviour at runtime.
Rename with a consistent suffix or prefix (`EventT`, `TResponse`).
[Details&nbsp;›](/validation/naming-conventions.md)

**3. Plain `number` where an integer is required.** `number` admits floats.
Use `VRefine<number, { minimum: 1, multipleOf: 1 }>` for an ID -
otherwise `1000.5` passes validation and fails later at the database, turning a clear validation error into a confusing query error.

**4. A non-string type on a target that doesn't coerce.** Only `query` coerces **numbers and booleans**;
route `params` coerce **numbers only**; `headers`, `cookies`, `form` and `raw` never coerce;
`json` carries real types natively.
[Details&nbsp;›](/validation/payload.md#validation-targets)

## Legal validation-target combinations

One body target (`json`, `form` or `raw` - mutually exclusive),
plus any mix of metadata targets (`query`, `headers`, `cookies`, valid on every method).
Two body targets, or a body target on a `GET`, is a dev-time error: KosmoJS warns and disables the affected schema.
[Details&nbsp;›](/validation/payload.md#validation-targets)

## Declare a `response` when the frontend consumes it

Without a `response`, the fetch client returns `Promise<unknown>` for that method,
there is no `ResponseT` entry, and no response validation or OpenAPI response schema.
Declaring `response: [200, "json", T]` switches on all four at once.

## Middleware placement

Shared across a route subtree -> a cascading `use.ts` in that folder:
it auto-wraps the folder and its subfolders and exports a `UseT` that cascades context types downward.
One route only -> an inline `use` inside `defineRoute`.
Global -> the `api/use.ts`.
Before validation -> an `edge:` prefixed slot on any of the above.
Every request, matched route or not -> `api/app.ts` - the only
layer that sees preflights, `405`s and unmatched URLs, so CORS belongs here.

Keep cascading middleware generic. It runs for sibling routes too, so a param like `id` may be `undefined` there.

## Navigation and framework hooks

The typed `Link` component takes a tuple of route name then params in path order -
`to={["users/[id]", 123]}` - plus an optional `query` prop.
TypeScript enforces the param types, so renaming a route folder surfaces an error at every stale `Link`.

`_/use` exists **only in Vue, Svelte and MDX folders**.
In React and SolidJS it does not resolve at all - use `react-router` / `@solidjs/router` instead.
Vue exports `useLoaderData` only;
Svelte and MDX add `useRoute`, `useParams`, `useParamsEntries` and `useSearchParams`,
and MDX adds `useFrontmatter`. `useLoaderData` returns `T | undefined`,
and a **layout** must pass its path-qualified name (`useLoaderData("dashboard/layout")`) where a page passes nothing.

## The dev server never shows the SSR path

Dev is **always** client-rendered - Vite with HMR - whether or not `frontend.ssr` is on.
The server entry (`renderToString` / `renderToStream`) and any SSG output exist only in a production build.
Do not reason about "the SSR code path" from what the dev server does; run `pnpm preview` to see the real thing.
[Details&nbsp;›](/dev-build-run/production-preview.md)
