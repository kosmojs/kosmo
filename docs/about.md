---
title: About KosmoJS
description: KosmoJS - the composable meta-framework.
    Organize multiple apps with directory-based routing, automatic runtime validation,
    typed fetch clients, and OpenAPI generation.
head:
  - - meta
    - name: keywords
      content: vite template, type-safe api, runtime validation, openapi generator,
        multi-app vite, directory-based routing
---

`KosmoJS` is named after the Greek "Kosmos" (κόσμος) - "order" or "world" -
reflecting the focus on organized, structured project architecture.

### 💡 What it does and how

Most projects eventually need more than one app - a marketing site, a customer dashboard,
an admin panel. The usual options work well but at the price of inevitable friction:

**Microservices** - each app in its own repo with its own `package.json`,
its own CI pipeline, its own deploy config. Shared types drift.
A database schema change means coordinating across repos.
You spend more time on infrastructure than on features.

**Monorepos** - everything in one repo, but now you manage
workspaces, package boundaries, internal dependency graphs, build caching configs,
and a `packages/shared` folder that becomes a dumping ground.
The tooling that's supposed to simplify things becomes its own project.

**DIY glue** - skip the tooling, wire it yourself. Shared scripts, custom build steps,
a hand-rolled dev server that stitches apps together. It works at first.
Then the project grows, a second developer joins, and nobody remembers
why `start-all.sh` passes `--legacy-peer-deps` or which app breaks
if you update the shared config. Homegrown infrastructure is cheap to build
and expensive to maintain.

::: info There's a simpler way
**KosmoJS** takes a different, **Vite**-inspired approach: **Source Folders**.
:::

Each app lives in its own folder with its own framework stack, base URL, and build output -
but they're not separate packages. They share one `package.json`, one `node_modules`,
one database layer, one set of types. You choose backend/frontend framework for each source folder,
while routing and validation patterns statys the same across all frameworks:

```
src/
├── app/          - React, Hono backend, base "/app"
├── admin/        - Vue, Koa backend, base "/admin"
└── marketing/    - MDX, no backend, base "/"
```

Need a type from the customer app in the admin dashboard? Import it.
Changed a database model? Every source folder sees the change immediately.
No publishing, no versioning, no workspace protocols.

Each folder has independent routing, middleware, layouts, config, and deploy configuration.
One command starts them all. One command builds them all.
And you can build or deploy a single folder when that's all you need.

### 🛠️ Under the hood

Add a source folder, pick a backend (`Koa` or `Hono`) and a frontend (`React`, `Vue`, `SolidJS`, or `MDX`).
Create files in `api/` and `pages/`, and they become routes automatically:

```
src/app/
├── api/
│   └── users/
│       └── [id]/
│           └── index.ts       ➜  GET /api/users/:id
└── pages/
    └── users/
        └── [id]/
            └── index.tsx      ➜  /users/:id
```


`KosmoJS` acts as a universal chassis - providing the same consistent way to define routes
for all source folders, regardless of framework, backend or frontend.

Thanks to this architecture, `KosmoJS` provides:

- [End-to-End Type Safety](/validation/intro)
- [Generated Fetch Clients + OpenAPI](/fetch/intro)
- [Composable Cascading Middleware](/backend/middleware)
- [Nested Layouts](/frontend/layouts)

and [More Features ➜](/features)

### ⚖️ How it differs

Most meta-frameworks choose your frontend framework for you and own your deployment model.
Monorepo tools give you flexibility but bury you in configuration.
Microservices give you independence but fragment your codebase.
DIY glue works until it doesn't - and by then it's load-bearing.

`KosmoJS` takes the best of each: the structure of a monorepo,
the simplicity of a single project, and the independence of separate apps -
without the overhead of any of them.

You keep full control over backend, frontend, state management, styling, database, and deploy target.
`KosmoJS` handles routing conventions, validation pipeline, middleware composition, development workflow  and build orchestration.

You focus on features, `KosmoJS` takes care of infrastructure.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
