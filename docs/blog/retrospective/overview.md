---
title: A year of silence
date: 2026-10-19
description: KosmoJS has been on GitHub for a year with no blog posts.
    This is the series that should have been written monthly.
    It arrives now because the API finally stopped moving.
head:
  - - meta
    - name: keywords
      content: kosmojs meta-framework, framework retrospective, api stability, framework design
tags: retrospective
---

KosmoJS has been on GitHub for a year now. In that year, it published exactly zero blog posts.

Not great.

The commit log has a thousand entries. The releases page has hundreds of tags. The docs cover everything.
And the blog has never said a word about any of it.

The changelog tells you *what* changed. It does not tell you *why*. That is the gap this series fills.

## The reason

The API was not stable enough to write about honestly.

Not unstable in the usual sense. It worked. And the docs were accurate about what the framework did.

Not stable in the sense that mattered. A post written in March would not still be true in September.

The route syntax changed three times in four months. The config went through three shapes.
Validation was rebuilt around per-target schemas, after having been a single payload.
Middleware got a new name and a new type argument. The error model broke in August.
Frontends went from two to five. Backends went from one to three.

A December post about params would have been outdated by March.
A March post about config would have been outdated by September.

That would have produced a blog teaching a version of the framework that no longer existed.
Which is worse than no blog, because a stale post has to be unlearned before the real thing can be learned.

So I stayed silent. Not a marketing decision. A design one. A framework's documentation is part of its API.
Publishing documentation that isn't true is a kind of API instability.

## The doubt underneath

There was a second reason, and it is less comfortable to write down.

Before August, I wasn't sure the framework was portable.

Not whether the API would stop changing. That was a matter of time.

Whether what worked for me would work for anyone else. On a stack I hadn't tested. In a deployment I hadn't tried.

Stability for my own use was proven. KosmoJS ran my projects. It ran several client projects I had migrated to it.
They did what they were supposed to do.

But "works for me" and "works for you" are different claims. I only had the first one.

The evidence arrived one stack at a time. Vue came, then MDX, then Svelte. Hono came, then H3.
By the time five frontends and three backends were running, most of the doubt was gone.

It faded slowly, though. Writing about it would not have made it fade faster.

A framework can't publish "this probably works" and call it stable. It has to work and guarantee some stability first.

## The three years before

The public year was the framework's fourth year, not its first.

KosmoJS existed for three years before it went public, as an internal tool.

The commit log starts with the repository, so it doesn't show those years. Only the fourth one.

Which explains something the public year raises on its own:
KosmoJS went from first commit to five frontends and three backends in under a year.

That is not fast development. That is three years of design decisions landing in a repository that didn't exist yet.

The route syntax went through three public iterations. It went through more than that in private.
The params syntax that shipped had been argued for over years, not over weeks.

Which changes how the public year reads. Not a year of exploration. A year of *settling*.

## The stabilization

By August and September, the API stopped changing shape.

Not because work stopped. A lot shipped in the last two months.
The [declarative config](/essentials/config), [edge middleware](/backend/edge-middleware),
[sidecars](/sidecar/intro), the [Vitest harness](/backend/testing),
the all-or-nothing [SSG](/frontend/static-site-generation) model.

Every one of them a real addition.

But the *shape* stabilized. The config shape. The middleware model. The backends and frontends.
The validation targets. The route syntax. The fetch client's contract. The error model.

None of them kept moving in ways that would invalidate a post.

For the first time, a post about this framework would still be true in six months.
That is what made this retrospective possible. Not a decision to write about the year, but the *ability* to.

The year had finally produced something that could be described and would stay.

## The series

So here it is.

One post per feature. What it was, what it became, and why it mattered.

Not a changelog. The changelog exists, and it is dry. These are the *reason* behind it.

Most of the series is biography: a feature's full arc, from the version that didn't work to the version that shipped.

---

* [Params syntax, three attempts](/blog/retrospective/params)
* [Middleware: step by step](/blog/retrospective/middleware)
* [Validation: TS at runtime](/blog/retrospective/validation)
* [Fetch clients: typed, validated, isomorphic](/blog/retrospective/fetch-clients)
* [Config: from wiring to describing](/blog/retrospective/config)
* [Three backends, one route spec](/blog/retrospective/backends)
* [Five frontends, one contract](/blog/retrospective/frontends)
* [Error handling: let handlers fail](/blog/retrospective/error-handling)
* [SSR and SSG: one powering another](/blog/retrospective/ssr-ssg)
* [CLI: The first five minutes](/blog/retrospective/cli)
* [Runtime: from many ports to one process](/blog/retrospective/runtime)
