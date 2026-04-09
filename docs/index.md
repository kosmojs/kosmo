---
layout: home
description: KosmoJS - the composable meta-framework

hero:
  name: KosmoJS
  tagline: <span class="tagline-container">
      <span class="headline">the composable meta-framework</span>
      <span>Multiple source folders. Directory-based routing.</span>
      <span>Cascading middleware. Nested layouts.</span>
      <span>End-to-end validation. Fetch clients. OpenAPI spec.</span>
      <span>Koa, Hono, SolidJS, React, Vue, MDX and more.</span>
    </span>
  # image:
  #   src: /KosmoJS.svg
  actions:
    - theme: brand
      text: Get Started ➜
      link: /start
    - theme: alt
      text: Explore Features ➜
      link: /features

features:
  - icon: 🗂️
    title: Multiple Source Folders
    details: Organize distinct concerns - public site, customer app, admin dashboard - as independent source folders within a single Vite project.
    link: /features

  - icon: 🛣️
    title: Directory-Based Routing
    details: Folder structure defines routes for both API and pages. Dynamic parameters, mixed segments, no separate routing config.
    link: /routing/intro

  - icon: 🪆
    title: Nested Layouts
    details: Compose shared UI - nav, sidebars, auth shells - at any level of the route hierarchy using nested layout components.
    link: /frontend/routing

  - icon: ⚡
    title: Power Syntax for Params
    details: Use raw path-to-regexp v8 patterns in folder names for precise URL control beyond standard named parameters.
    link: /routing/params

  - icon: 🛡️
    title: End-to-End Type Safety
    details: Write TypeScript types once - runtime validation, typed fetch clients, and OpenAPI docs all derived from the same definitions.
    link: /validation/intro

  - icon: 🔗
    title: Generated Fetch Clients + OpenAPI
    details: Fully-typed fetch clients with client-side validation. Invalid requests never reach your server. OpenAPI 3.1 spec generated automatically.
    link: /fetch/intro

  - icon: 🎛️
    title: Composable Middleware (Slots)
    details: Override global middleware per-route or per-subtree using named slots. Replace only what needs replacing, inherit everything else.
    link: /api-server/middleware

  - icon: 🌊
    title: Cascading Middleware
    details: Place a use.ts in any folder and its middleware automatically wraps all routes in that subtree. No imports or wiring needed.
    link: /api-server/cascading-middleware

  - icon: 🎨
    title: Multiple Frameworks
    details: Koa or Hono for backend, React, Vue, SolidJS or MDX for frontend. Different source folders can use different combinations.
    link: /start

---

<CodeSamples />

<div class="text-center">
<LinkButton href="/start">Get Started</LinkButton>
</div>

## 🎯 What is KosmoJS?

`KosmoJS` is a composable **meta-framework** that integrates `TypeScript`, `Vite`, `Koa`/`Hono`,
and your frontend framework into a clear organizational pattern.
Separation of concerns isn't something you have to remember - it's built into the structure.

No proprietary abstractions. No new paradigms. Just thoughtful structure around tools you already know.

📘 [Learn more](/about)

---

## 💡 Why Source Folders?

Applications often include multiple distinct concerns - each with different routing, auth, and config:

🔹 Public marketing site at `/`<br>
🔹 Customer application at `/app`<br>
🔹 Admin dashboard at `/admin`<br>

Each lives in its own source folder with independent `api/` and `pages/` directories,
sharing types and validation logic across a single project.
The directory structure enforces boundaries that code review can't.

📘 [Getting started](/start) · [Directory-based routing](/routing/intro)

---

## 🛡️ One Source of Truth

`KosmoJS` converts your `TypeScript` types into runtime validators, typed fetch clients,
client-side validation, and OpenAPI schemas - all from the same definitions.
No duplication, no drift.

📘 [Type safety](/api-server/type-safety) · [Validation](/validation/intro) · [Fetch clients](/fetch/intro)

---

## ⚙️ API Development

Build APIs inside Vite's dev server with hot-reload. Slot-based middleware gives you
fine-grained control - override globals per-route or per-subtree, compose request handling precisely.
What you build locally is what deploys.

📘 [Dev workflow](/api-server/development-workflow) · [Middleware](/api-server/middleware)

---

## 🚀 Production Ready

`pnpm build` produces a bundled API server, optimized frontend assets,
and an optional SSR bundle. Deploy to Node.js, Deno, Bun, containers, serverless, or edge.

📘 [Production build](/api-server/building-for-production)

---

## 🧠 Philosophy

**Structure without constraints.**

Opinionated about organization, unopinionated about implementation.
You choose your frontend framework, state management, styling, database - everything else.
The structure scales; your choices remain free.

📘 [About KosmoJS](/about) · [Features](/features)

<hr />
<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
