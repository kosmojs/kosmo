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
It is built around a specific approach to organizing full-stack applications.

Each source folder is a separate app - its own choice of backend and frontend framework,
base URL, build pipeline, and deploy strategy -
yet all sharing the same infrastructure within a monorepo-like project.

Backend: **Koa** or **Hono**. Frontend: **React**, **Vue**, or **SolidJS**.
Same routing architecture and type safety across all combinations.

`KosmoJS` acts as a universal chassis - providing the same consistent way to define routes for all source folders, regardless of framework, backend or frontend.

**That's the unified routing pattern.**

And a way to define validation rules directly in TypeScript, without using yet another lib.

**That's the unified validation pattern.**

Also a unified development workflow and a unified build pipeline.

---

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
