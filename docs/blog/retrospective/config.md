---
title: "Config: from wiring to describing"
sidebarTitle: Configuration
date: 2026-10-23
description: A source folder's config went through three shapes, a Vite config,
    a list of generators, a declarative description.
    Each one took a decision away from the developer, and none of them was planned.
head:
  - - meta
    - name: keywords
      content: kosmojs config, vite config, declarative config
tags: retrospective, config
---

Every source folder has to answer one question: what are you?

React or Vue. Hono or Koa. Where do you live in the URL. Do you render on the server.
That's the folder's identity, and it has to be written down somewhere.

The hard part was never *whether* to write it down.
The hard part was what the file should look like.

It took three shapes to find out.
Each one removed a decision I had been quietly handing to the developer.

## Step 0: the Vite config was the config

In the beginning, a folder had one config file. It was `vite.config.ts`.

~~~ts
// front/vite.config.ts
export default defineConfig(import.meta.dirname, {
  base: join(baseurl, "/"),
  server: { port: 4000 },
  plugins: [
    devPlugin(apiurl, {
      generators: [reactGenerator()],
    }),
  ],
});
~~~

It worked. It also lied.

The file said "Vite". But most of what it did had nothing to do with Vite.
`reactGenerator()` is the folder's frontend.
`base` is where the folder lives.
Vite just happens to be the one serving it.

So a new developer would open the file and ask the natural question:
<span class="text-nowrap">*how do I configure Vite here?*</span>

The honest answer was "mostly, you don't". The file never said that.

It had a second problem. It was a recipe.

Construct this plugin, with these arguments, joined with that base URL.
Nowhere did it say what the folder actually *was*.

Ask someone what's in a house and hand them the builder's invoice.
Technically complete. Not what they asked.

## Step 1: the generators are the config

March. The fix was to stop pretending.
The config isn't a Vite config. KosmoJS drives Vite, not the other way around.

~~~ts
// front/kosmo.config.ts
export default defineConfig({
  plugins: [],
  generators: [reactGenerator()],
});
~~~

Smaller. And finally about the folder.
A React frontend is `reactGenerator()`. A Hono backend is `honoGenerator()`. SSR is `ssrGenerator()`.
List what you need, and the folder wires itself.

Yet, it remained a recipe. Import a list of generators, wire them, guess each generator's options.

## Step 2: a prefix is not a setting

July. A small change, and the one that tipped everything.

Until then `base` was optional. Skip it and the folder fell back to something.
That something was not always what you expected.

So `base` became required.

It sounds minor, and it was. But it was the first time the config said out loud:
a folder's URL prefix is not a setting with a default.
It's a *fact* about the folder.

Once one key was a fact, the rest of the file started to look suspicious.
Why was everything else still instructions?

## Step 3: describe the folder

September. The list of generators is gone.

~~~ts
// app/kosmo.config.ts
export default defineConfig({
  frontend: {
    stack: "react",
    base: "/",
    ssr: true,
  },
  backend: {
    stack: "hono",
    base: "/api",
  },
  fetch: true,
  validation: true,
});
~~~

Two blocks, one per side of the folder. A few flags for the things that cut across both.
No generators, no order, no Vite.

You say what the folder has. KosmoJS knows which generators that means, and in what order.
`ssr: true` brings in the SSR generator. `validation: true` brings in the validators.

Two details fell out of this on their own.

The top-level `plugins` array disappeared.
It was a Vite plugin list wearing a folder-config costume.
Vite plugins now live in `viteConfig.plugins`, inside the side they belong to.
Folder config and Vite config share a file again, but no longer share a namespace.

And `fetch` moved up a level.
It used to hang off the backend, since the clients are derived from backend routes.
But a folder can have fetch clients and no frontend, or a backend and no fetch clients.
It was never a property of the backend. It was a property of the folder.
Now the file says so.

### Why not earlier?

Two things had to settle first.

Generators had to be able to declare what they depend on.
Without that, the framework couldn't sort them, and hiding the order would have been a lie.

And the keys needed names that stopped moving.
`stack`, `base`, `ssr`, `ssg`, `tanstack`, `openapi`.
A declarative config is only as good as its vocabulary.
Otherwise it's a list of generators with nicer labels.

## Step 4: a port is not a host

The last change was the smallest.

Project-level settings, the few that aren't per folder, live in `package.json`;
initially at the top level, later under the `kosmo` key.

There were `devPort` and `previewPort`. They became `kosmo.devHost` and `kosmo.previewHost`.

A port is `4556`. A host is `127.0.0.1:4556`.
Binding a socket needs only the first.
But a dev server may need to run on an address different from `127.0.0.1`,
and `kosmo.devHost`/`kosmo.previewHost` is the most direct way to express that.

### And no project-wide config

You may have noticed there isn't one. Each folder owns its `kosmo.config.ts`.
That's on purpose.

A project-wide config is a shared surface every folder inherits and can't quite escape.
Marketing wants SSR. Admin wants CSR. The API-only folder wants neither.
Forcing them onto one definition means none of them gets what it asked for.

The few things that really are global, the hosts and the dist directory, live in `package.json`.
Every Node project already has one.
Fewer files to learn, one fewer place to look.
