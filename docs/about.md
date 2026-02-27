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

`KosmoJS` is named after the Greek "Kosmos" (κόσμος), meaning "order" or "world",
reflecting the focus on organized, structured project architecture.

### 🎯 What is KosmoJS?

Simply a `Vite` template evolved into a meta-framework that brings another approach
(not entirely novel, but proven valuable) to organizing full-stack applications.

Unlike traditional frameworks that lock you into specific technologies,
`KosmoJS` lets you choose the tools that work best for you and your team -
with `Koa` or `Hono` for the backend and `SolidJS`, `React` or `Vue`  for the frontend.

You keep all of `Vite` power and ecosystem while working within a structure
designed around specific organizational principles that scale with your application.

### 💡 Choose Your Stack

`KosmoJS` is framework-agnostic where it matters:

🔹 **Backend**: Choose between **Koa** or **Hono** for your API layer.
Same routing architecture, same type safety - just pick the framework that fits your team's experience and preferences.

🔹 **Frontend**: Build with **React**, **Vue**, or **SolidJS**.
Each generator provides framework-specific patterns and best practices while maintaining the same routing conventions.

🔹 **Architecture**: Multiple source folders let you organize distinct areas -
perhaps a public website, an admin dashboard, a mobile API -
each with its own framework choice and configuration, all within a single Vite project.

### 🏗️ Core Principles

`KosmoJS`'s approach centers on three key ideas:

🔹 First, it recognizes that applications often comprise multiple distinct areas -
and treats these as independent source folders, each with its own configuration and purpose,
all within a single unified project.

🔹 Second, it organizes each source folder into separate `api/` and `pages/` directories,
creating a clear boundary between server-side logic and client-side presentation within the same cohesive module.

🔹 Third, it establishes a single source of truth for your data structures.
Write `TypeScript` types once, and `KosmoJS` generates runtime validation, typed fetch clients, and `OpenAPI` schemas automatically -
keeping compile-time type checking, runtime validation, and API documentation perfectly aligned.

---

**Start building with better structure:**

Try `KosmoJS` and experience how much clearer full-stack development becomes
when you have the freedom to choose your frameworks while maintaining
end-to-end type safety and separation of concerns by default.

<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
