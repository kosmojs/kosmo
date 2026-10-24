---
title: Params syntax, three attempts
sidebarTitle: Params syntax
date: 2026-10-20
description: Every routing framework has its own way of writing `[id]`.
    KosmoJS uses one syntax everywhere. Getting there took three attempts,
    and I'm glad I don't like the first one anymore.
head:
  - - meta
    - name: keywords
      content: kosmojs routing, route params syntax, optional route params,
        splat params, catch-all route, path-to-regexp, directory based routing
tags: retrospective, routing, params, dx
---

Every routing framework has its own way of writing `[id]`.
Brackets here. Colons there. A dollar sign for the next one.
Angle brackets, for the brave.

None of it is hard. That's the trap.

Each spelling is one small line of muscle memory.
Together they add up to a tax, and teams pay it the cheap way:
pick one stack, never leave.

I didn't want KosmoJS to collect that tax.
So there is [one syntax](/routing/params) for every route.
Backend or frontend. Koa, Hono, H3, React, Vue, Solid, Svelte, MDX.

It took three tries.

## Attempt one: brackets everywhere

The first version looked like SolidStart.
It also looked like Next.js.
When two big frameworks agree, you assume the question is closed.
It felt right before it had earned anything.

~~~
users/[id]/index.ts           required
users/[[id]]/index.ts         optional
docs/[...path]/index.ts       splat
~~~

`[id]` was perfect from day one.
A folder named `[id]` looks like exactly what it is.

`[[id]]` was not.
On the page it reads fine. At the keyboard it's a coin toss.
Is it `[[id]]` or `[ [id] ]`?

I mistyped it often enough to stop calling it a user problem.
The notation was sound. My fingers disagreed.

## Attempt two: borrow the engine's grammar

February. Routing moved onto `path-to-regexp`,
and with it came routes like `[id]-[data].json`.

Then the obvious thought.
The engine already has a syntax. Why invent another?

~~~
users/:id/index.ts            required
users/{:id}/index.ts          optional
docs/{...path}/index.ts       splat
~~~

`:id` is the Express dialect. Every backend developer knows it.

`{:id}` is where it fell apart.
It doesn't say *this parameter may be absent*.
It says *something in braces that happens to contain a colon*.
Two ideas in one token.
Perfect for a parser. Confusing for a person.

Then I opened a terminal.
`cd src/front/api/users/:id` looks like you're passing an argument,
not walking into a folder.

I had borrowed a notation, and it showed up with its owner's grammar.
Good engine. Wrong vocabulary.

## Attempt three: brackets stay, the rest gets simpler

I kept the half of each attempt that had survived real use.

~~~
users/[id]/index.ts           required
users/{id}/index.ts           optional
docs/{...path}/index.ts       splat
~~~

`[id]` came back from attempt one. It was right all along.

`{id}` came from attempt two, minus the colon.
Curly braces already mean "this may resolve to something" in most templating languages.
So `posts/{category}` reads like a route where `category` is optional.
Because it is.

The whole thing became one rule:
**square brackets must be present, curly braces may be absent.**
No third convention to remember.

## The escape hatch

Some routes don't fit. An optional static part, or a segment with its own punctuation.

~~~
products/{:category.html}     -> /products, /products/electronics.html
book{-:id}-info               -> /book-info, /book-123-info
~~~

For those, the rule is short.
**A param name with non-alphanumeric characters is a raw `path-to-regexp` pattern.**
The brackets drop away and you get the full grammar underneath.

The docs call it [power syntax](/routing/params#power-syntax), which is a bit grand.
It's an escape hatch.

But it's the reason the bracket notation could stay small.
A syntax with no escape hatch has to grow until it covers every case.
One with an escape hatch can stay at 95% and stay readable.

## What it taught me

Each syntax took a few days to implement.
Deciding which one was right took months.

You can't argue for the next version before the previous one exists.
You build it, you live with it, and one day you notice you flinch every time you type it.
That flinch is the whole design process.

If you still love the syntax you wrote a year ago,
you probably haven't learned much in a year.

I don't love attempt one anymore.
That's the good news.

The three routing specs in KosmoJS's history aren't indecision.
They're the shortest path I found to the one in the docs today.
