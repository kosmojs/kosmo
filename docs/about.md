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

### 🎯 What is KosmoJS?

A `Vite` template evolved into a composable meta-framework.<br/>
It is built around a specific approach to organizing full-stack applications.<br/>
You keep the full Vite ecosystem while working within a structure designed to scale.

Backend: **Koa** or **Hono**. Frontend: **React**, **Vue**, or **SolidJS**.
Same routing architecture and type safety across all combinations.

`KosmoJS` acts as a universal chassis - providing the same consistent way to define routes for all source folders, regardless of framework, backend or frontend.

**That's the unified routing pattern.**

And a way to define validation rules directly in TypeScript, without using yet another lib.

**That's the unified validation pattern.**

Also a unified development workflow and a unified build pipeline.

---

### 🏗️ Core Principles

**Unified routing pattern** - one consistent way to define routes across all frameworks,
backend or frontend. Directory-based routing, same dynamic param notation everywhere:
`[required]`, `{optional}`, `{...splat}`. The chassis handles wiring into whichever
framework each source folder uses.

**Unified validation pattern** - write `TypeScript` types once and use them for runtime validation.
No extra libs, no schema duplication, no drift. The same definitions drive
compile-time checking, runtime validation, typed fetch clients, and `OpenAPI` docs.

**Clear api/pages boundary** - each source folder separates server-side logic (`api/`)
from client-side presentation (`pages/`). No client code on the server, no exceptions.

**Composable middleware** - cascading `use.ts` files wrap entire route subtrees automatically.
Slot-based overrides give surgical control without touching parent middleware.

**Multiple source folders** - distinct concerns (public site, admin dashboard, customer app)
live as independent source folders within a single project, each with its own framework,
base URL, dev server port, and deploy strategy.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
