---
layout: home
description: KosmoJS - the composable meta-framework

hero:
  name: <span class="k">Kosmo</span>JS
  tagline: <span class="tagline-container">
      <span class="headline text-nowrap">the composable meta-framework</span>
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
    link: /backend/middleware

  - icon: 🌊
    title: Cascading Middleware
    details: Place a use.ts in any folder and its middleware automatically wraps all routes in that subtree. No imports or wiring needed.
    link: /backend/cascading-middleware

  - icon: 🎨
    title: Multiple Frameworks
    details: Mix and match backend and frontend frameworks across source folders. Each folder gets its own stack, all sharing the same routing and validation architecture.
    link: /start

---

<div class="glow-bg">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
</div>

<CodeSamples />

<div class="text-center">
<LinkButton href="/start">Get Started</LinkButton>
</div>

---

`KosmoJS` is opinionated about organization, unopinionated about implementation.

It gives your full-stack project a consistent structure - multiple source folders,
directory-based routing, end-to-end validation, cascading middleware, nested layouts, fetch clients etc.
Everything works the same consistent way across every framework combination, backend or frontend.

Separation of concerns isn't something you have to remember; it's built into the core.

No proprietary abstractions. No new paradigms.
Just structure on top of tools you already know.

📘 [Learn more](/about)

---

## 💡 Why Source Folders?

Most projects start as one app and quietly become three -
a marketing site, a customer app, an admin dashboard -
each needing different routing, auth, and deploy strategies.

Source folders make this explicit from the start.
Each gets its own `api/` and `pages/` directories, its own framework stack, its own base URL -
while sharing types, validation logic, and infrastructure across a single project.
The directory structure enforces boundaries that code review alone can't.

📘 [Getting started](/start) · [Directory-based routing](/routing/intro)

---

## 🛡️ One Source of Truth

`KosmoJS` converts your `TypeScript` types into runtime validators, typed fetch clients,
client-side validation, and OpenAPI schemas - all from the same definitions.
No duplication, no drift.

📘 [Type safety](/backend/type-safety) · [Validation](/validation/intro) · [Fetch clients](/fetch/intro)

---

## ⚙️ API Development

What you build locally is what deploys.

APIs run inside Vite's dev server with full hot-reload.
Slot-based middleware gives you surgical control - override globals per-route
or per-subtree, compose request handling without the usual middleware spaghetti.

📘 [Dev workflow](/backend/development-workflow) · [Middleware](/backend/middleware)

---

## 🚀 Production Ready

`pnpm build` produces a bundled API server, optimized frontend assets,
and an optional SSR bundle - each deployable independently.
Node.js, Deno, Bun, containers, serverless, or edge. Same build output, pick your runtime.

📘 [Production build](/backend/building-for-production)

---

## 🧠 Philosophy

**Structure that scales. Choices that stay yours.**

You pick the frontend framework, state management, styling, database, deploy target - everything.
`KosmoJS` provides the organizational layer: routing conventions, validation pipeline,
middleware composition, build orchestration. The kind of structure
that's tedious to set up yourself and easy to let erode over time.

📘 [About KosmoJS](/about) · [Features](/features)

<hr />
<div class="text-center">
  <LinkButton href="/start">Get Started</LinkButton>
</div>
