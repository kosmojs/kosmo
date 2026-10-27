---
title: "Runtime: from many ports to one process"
sidebarTitle: Runtime
date: 2026-10-27
description: >-
    Every source folder used to be its own server, on its own port, and the docs defended it.
    A year later one process serves them all. The boundary never moved.
    It was just never where I thought it was.
head:
  - - meta
    - name: keywords
      content: kosmojs dev server, kosmojs runtime, dist/run.js, kosmo preview,
        vite middleware mode, multiple apps one port, node bun deno
tags: retrospective, runtime, dev-server, deployment
---

A KosmoJS project is several apps in one codebase.
A marketing site, a customer app, an admin panel, each in its own source folder.

So the first question was obvious: how do you run them?

The first answer was obvious too. Each folder is its own server.

## A port per folder

In November, starting a project looked like this:

~~~sh
pnpm dev @front       # port 4000
pnpm dev @admin       # port 4001
~~~

One command per folder. One port per folder.
Each folder had its own `vite.config.ts` with a port in it.

And the docs were proud of it:

> Port separation reinforces the organizational structure -
> no accidental cross-contamination.

Production followed the same shape.
Build a folder, run its server, deploy it to its own host:

~~~sh
node dist/@front/api/index.js
~~~

~~~
dist/@front -> app.example.com
dist/@admin -> admin.example.com
~~~

It made sense. Folders are independent, so their servers should be too.

It also meant three terminals for three folders.
Three ports to remember.
And a reverse proxy if you wanted to click from the marketing site into the app
and stay on the same host.

## The boundary was the path, not the port

Read that old docs page again and there is a sentence that gives the game away.
It says the folders would deploy as "separate services on different base URLs".

Base URLs. Not ports.

Every folder already had its own `base`. The marketing site lived at `/`,
the admin panel at `/admin`, the API at `/api`.
Two folders could never claim the same path.

So the port was doing a job the path was already doing.

In March the dev server became one process.
One HTTP server, one port, every folder's Vite running in middleware mode behind it.
A request comes in, the server looks at the path, and hands it to the folder that owns it.

It landed on March 25, the same day `vite.config.ts` gave way to `kosmo.config.ts`.
Not a coincidence. A folder no longer needed its own Vite config,
because it no longer needed its own server.

## The small print

One server dispatching by path sounds trivial. It mostly was.
It still had its moments.

The first version sorted the folders to make sure `/admin` was tried before `/`.
Except it sorted them by folder *name*, not by URL.
So a folder at `/` and a folder at `/admin` were tried in whatever order their names came in,
and when the root went first, it answered for both. Fixed in April.

Then the ports came back, through the side door.
Every Vite still needs its own HMR socket, and they all asked for a free port at once.
They all got the same one.

So the ports did not disappear. They went backstage.
Today the dev server reserves a block of free ports up front, a few per folder,
and you only ever see one.

## Dev never renders on the server

One thing the single dev server deliberately does not do: render on the server.

`pnpm dev` is Vite, HMR and client-side rendering, whether or not a folder has SSR enabled.
That keeps the loop fast, and it is the right default.

But it meant that seeing a server-rendered page took a ritual:

~~~sh
pnpm build front
node dist/front/ssr/server.js -p 4556
~~~

Edit, build, start, look. Edit, build, start, look.
The docs even had a section on making that loop "less painful".

When the docs start apologizing for a workflow, the workflow is the bug.

## One file to run them all

August 31. Two things shipped together.

The build started writing `dist/run.js`:
one entry point that serves every folder in the project,
dispatching by path exactly the way the dev server does, longest prefix first.

~~~sh
node dist/run.js -p 4556
~~~

A marketing site at `/`, an admin app at `/admin`, an API-only folder at `/svc`.
One process, one port, no reverse proxy.
SSR folders render on the server, CSR folders are served as static assets,
API-only folders answer on their base.
Nothing to configure. It follows from each folder's config.

And [kosmo preview](/frontend/server-side-render#preview) arrived on top of it:
build the project, run `dist/run.js`, rebuild on change.
The production output with a development loop.

It listens on its own port, so preview and dev run side by side.
Client-rendered in one tab, server-rendered in the next.

The ritual was gone.

The old model did not go away either.
Every folder's bundles are still runnable on their own,
so a project that wants the admin panel on a separate host still can.
One process became the default. It did not become the only way.

## Three routers, one rule

Then a quiet problem surfaced. There were now three places that matched paths to folders:
the dev server, the backend server, and `dist/run.js`.

Three places means three chances to disagree.

They did, in small ways.
Route aliases matched in one and not in another.
And a folder at the root base, `/`, had a bug of its own:
the prefix check glued a slash to the base, and `/` plus `/` is `//`.
Requests do not start with `//`.

Both were fixed in early September, and all three now apply the same rule.
Unglamorous work. It is also the only reason "preview shows what production serves" is true.

## Node, Bun, Deno

The runtime question came almost for free.

In April the Hono server learned to run natively on Node, Deno and Bun.
And `dist/run.js` is plain `node:http`, which Bun and Deno both implement.
So the same file runs on all three:

~~~sh
node dist/run.js -p 4556
bun dist/run.js -p 4556
deno run -A dist/run.js -p 4556
~~~

Nothing in the dispatcher is tied to one runtime's server API.

There was one detour on the way.
In April, SSR builds bundled every dependency into one self-contained file,
something you could run without `node_modules`.
It lasted three weeks. Dependencies are external again.

## Where the boundary lives

Looking back, nothing about the folders changed.
They are still independent. They still build on their own, deploy on their own if you want.

What changed is where I thought the boundary was.

I thought it was the port, so every folder got a server.
It was the path all along. Every folder already had one,
and nothing else had to keep them apart.

Once the path did the job, the ports became an implementation detail.
And one process could serve the whole project, in dev, in preview, and in production.
