---
title: Five frontends, one contract
sidebarTitle: Frontends
date: 2026-10-24
description: >-
    KosmoJS started as a Solid template and went public with two frontends.
    Today it runs five, each keeping its own idioms.
tags: retrospective, frontend
---

KosmoJS supports five frontend frameworks: React, Solid, Vue, Svelte and MDX.

Adding Vue took one day. Adding Svelte took a 39-file commit.

Same contract. Very different afternoons.

That gap is the whole story of how KosmoJS handles frontends, and it starts somewhere unglamorous:
with a template that had exactly one.

What made the first cheap and the second possible is a contract:
a short list of what a framework has to provide, so it gets the rest for free.

I didn't design it. I noticed it. Which is a much more honest way to find a contract.

## Step 0: it started as a template

KosmoJS did not begin as a meta-framework.
It began as a Vite template. Solid on the front, Koa on the back.

One frontend. One backend. No contract.
Just a stack that happened to work.

Then it grew some structure.
Still a template, only a tidier one.

Somewhere after that, it became what it is now:
backends and frontends composed into folders, folders composed into projects.

But the folder only means something if different ones can hold different things.
And at that point there was exactly one frontend to hold.

## Step 1: React, just before going public

Shortly before the repo went public, I added React next to Solid.

GitHub shows both from the very first commit.
That's true of the repo. It isn't true of the idea.

A second frontend forced a question I hadn't needed to ask:
what do the two of them actually share?

The answer was smaller than I expected.
A frontend, in KosmoJS, is a function.
It takes a folder of `pages/` files and returns a route tree the framework's own router can render.

~~~
pages/
  index/index.tsx         -> /
  users/[id]/index.tsx    -> /users/:id
  dashboard/
    layout.tsx            -> wraps everything below
    index.tsx             -> /dashboard
~~~

For React, that's a plain React Router config, the one you'd have written by hand.
For Solid, the same thing against Solid Router.
In both cases KosmoJS doesn't route anything at runtime.
It scans, hands over, and steps away.

Everything else follows from what each router already does.
Children in a layout are `<Outlet />` in React and `props.children` in Solid.
KosmoJS wraps none of it. A React developer writes React.

Shared between the two: the folder convention and the route contract.
That was the whole deal.

## Step 2: Vue, in a day

Vue landed on November 17, nine days after launch.
One commit, plus tests and docs. One day.

Most of the work had been done months earlier, by two frameworks that proved the contract works.
Vue just fit.

A Vite plugin, an integration with Vue Router, a layout that renders `<RouterView />`.
That was the whole list. No exceptions, no surprises.

A contract that works for three frameworks can't be a coincidence.
But it went suspiciously smooth. So I waited for the next one.

## Step 3: MDX, and a bigger question

April. MDX asked more than any framework before it.

It isn't really a framework. It's content: Markdown with JSX in it, compiled to Preact,
rendered to static HTML, shipping almost no JavaScript.

The contract held. The shape of each piece changed.
Pages are `.mdx` files, scanned the same way as `.tsx`.
Layouts render `props.children`, same as Solid.
The route syntax is exactly the one you already know.

Then came the questions...

**Routing first.**

React, Solid and Vue each came with a router. MDX has none.
So for the first time there was nothing to hand the route tree *to*,
and KosmoJS had to supply the router itself.

**Then data.**

React Router and Solid Router both have a built-in way to load data before a page renders.
Vue could use lifecycle hooks to get data loaded into pages.
MDX has nothing like it.

So KosmoJS supplied one: export a `loader`, read it with `useLoaderData()`.
The same idea React and Solid already use.

And it worked so well for MDX that, in short order, it landed on Vue too.

## Step 4: Svelte, same pattern to follow

July. Svelte time.

Though it has a router, it lives inside SvelteKit, and SvelteKit is a whole framework.
KosmoJS uses Svelte's UI layer, not SvelteKit.

So, as with MDX, KosmoJS supplied the router and the loaders.
Its own matcher, its own route shape, same folder convention,
same `[id]`, `{id}`, `{...path}`, same `loader` and `useLoaderData`.
Layouts still wrap children with `{@render children()}`, because that's what Svelte does.

That's where the contract earned its keep. For three frameworks it *reduced* the work.
For two it *expanded* it. The developer-facing API didn't move an inch.

Same contract, different supply chain. That's what a contract is for.

## What about mixing?

Someone asks every time: what if one project has a React folder and a Vue folder?

Nothing happens. Yet, everything just works. Source folders are independent entities.

`_/api` in one folder resolves to that folder's own generated file,
with its own route names and its own types. Nothing leaks.
Each folder has its own `tsconfig.json` with the right JSX settings for its framework.
