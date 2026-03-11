---
title: About KosmoJS
description: KosmoJS is a Vite-based full-stack meta-framework for type-safe apps.
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

A `Vite` template evolved into a meta-framework built around a specific approach
to organizing full-stack applications. You keep the full Vite ecosystem
while working within a structure designed to scale.

Backend: **Koa** or **Hono**. Frontend: **React**, **Vue**, or **SolidJS**.
Same routing architecture and type safety across all combinations.

### 🏗️ Core Principles

**Multiple source folders** - applications often include distinct concerns
(public site, admin dashboard, mobile API). Each gets its own source folder
with independent configuration, all within a single Vite project.

**Clear api/pages boundary** - each source folder separates server-side logic (`api/`)
from client-side presentation (`pages/`), keeping them cohesive without mixing concerns.

**Single source of truth** - write `TypeScript` types once.
`KosmoJS` generates runtime validation, typed fetch clients, and `OpenAPI` schemas
automatically - compile-time checking, runtime validation, and API docs stay in sync.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
