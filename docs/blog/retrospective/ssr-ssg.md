---
title: "SSR and SSG: one powering another"
sidebarTitle: SSR & SSG
date: 2026-10-25
description: >-
    KosmoJS was never built around SSR.
    How it arrived anyway, how much of it Vite had already covered,
    and how SSG grew out of a disposable SSR server.
head:
  - - meta
    - name: keywords
      content: kosmojs ssr, kosmojs ssg
tags: retrospective, ssr, ssg
---

Initially, KosmoJS was not built around any SSR plans.

It was supposed to solve the problem of building several apps under the same umbrella:
uniform routing, uniform validation, uniform dev experience.
The whole velocity was around this problem.

Only after the pattern was established, which took about two years, no way less,
did it turn out that "extra" stuff like SSR is not just a nicety to have.

It's rather an essential factor nowadays.
It's something that determines the decision, and its absence confused customers the most.

## The investigation

So the investigation in that direction began. There was a suspicion that SSR is not a big deal,
but I never expected it would be that easy to implement and that stable at work.

Vite had this covered in the same elegant way it covered many other aspects.
Everything was rendering just fine on the client. Just start a server, listen for requests,
pass the matched ones through the Vite pipeline, send the response.

That's pretty much all. That's the power of Vite as a platform. The rest are implementation details.

Initially I used a bare Node server and it worked well, but with substantial quirks on streaming.
The user had to wire the streaming manually, and KosmoJS only provided a raw stream.
That was awkward, I must admit.

Later, when Hono joined KosmoJS, I could not resist Hono's streaming mode, and SSR migrated to Hono.
Amazing results, and an amazingly reshaped developer experience: the user no longer cares about streaming,
with a uniform declarative config for both string and streaming modes:

~~~ts
export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
~~~

## The quirk that took way too long

Another quirk that took way too long was critical CSS.
For some mysterious reason I decided to extract CSS manually and hand it to the user.

It worked to some extent for some time, until various sporadic issues started appearing,
especially with regard to nested layouts, when the extracting logic started looking like a pile of crutches.

Then I realized, again, that I was solving a problem I did not have:
Vite had always had this covered, and in a superior way.
So I just let Vite handle critical CSS, and the problem disappeared.

## Half-baked

And all looked good, until the first page needed data.
That's when it showed how half-baked SSR still was. It was rendering synchronous stuff only.
Put a fetch in a page and it rendered only what the page had before the fetch started.

SSR was not waiting for async stuff.
And that's not SSR that translates to server-side rendering. That's SSR that translates to synchronous server rendering.

But isomorphic fetch clients solved that elegantly, keeping the same syntax
and switching only the transport, depending on the environment.

Yes, it was implemented awkwardly at first: by writing a key to a file
and leaving a residual for the next run
(the build wrote one key, the dev server another, both to the same file).

Happily, Vite had a superior solution for this as well: virtual modules.
Now the transport switches transparently.

It felt, again, like playing kid games on the shoulders of a giant.

## Errors

But it was way too early to celebrate. Isomorphic fetch did not come alone. It brought async errors.

The initial take was the simplest: have the user catch fetch errors.
Any page that is supposed to be server-rendered should make sure nothing raises during render.
Otherwise a 500 error is sent to the client.

Problem solved, sort of.
It just annoyed people and caused many to give up on SSR.
And that somehow tipped the solution: make the server give up, not the user.

What if, during SSR, errors are caught and the server sends back the client shell?
Then on the client the error boundary takes over and renders the proper UI.

And to close the loop, the user gets an `onError` hook for reporting SSR errors.
It may look like an awkward solution, but it works well so far, with no complaints.
The syntax stays the same, there is no try/catch ritual everywhere, and the UI gets consistent.

But a gap still remains.
Stream-rendered pages cannot catch async errors cleanly, so there is no client fallback on those.
Those are the ones that truly need try/catch.

## SSG

That's how SSR came along.
But by the time MDX support was added, it became clear SSR was not enough.
Static content needs a static render that runs everywhere without a server.

It did not take long to conceive a solution where SSR is used as the entry point for the SSG pipeline:
start a disposable SSR server, make a request, write the result to a file.

Which means SSG has no renderer of its own.
Whatever SSR does, SSG does: routing, middleware, loaders, in-process fetch clients.
Every page is rendered as if a visitor had asked for it.

Not without a consequence though: the build needs production access.
Not something close to production. The actual database, the actual CMS, whatever the routes read.

If the build can't reach them, nothing renders. Static here doesn't mean HTML from whatever is on disk.
It means every page rendered against real data, at the moment of the deploy.

It worked well for static MDX content, without big plans to extend to other frameworks.
But by August, when the SSR pattern was established and every framework worked consistently the same way,
there was no reason to keep SSG MDX-only.

So every framework got a uniform SSR+SSG setup, with a uniform dev experience and a consistent outcome.

### Dynamic routes

The only question remaining at the time - dynamic routes.
A visitor brings a URL. A build brings nothing,
so a route like `docs/[slug]` has no way to know which slugs to render.

Solved the standard way: the page provides a static params list,
the loader runs once per entry, and the data is baked into that entry's HTML:

~~~ts
export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
  ["validation"],
]);
~~~

In MDX the list lives in the frontmatter; in the other frameworks it's a named export,
in whatever form the framework's file format allows.

A dynamic route without a list is skipped. No data beats fake data.

### Errors

SSG failure policy is the opposite of SSR's. SSR falls back, because a visitor is waiting.
At build time nobody is waiting. The build is a promise about the next deploy.

So one failed page means nothing is written, the build exits non-zero,
and you get one summary of everything that broke.

A fallback here would hide the failure instead of recovering from it:
an empty shell returns `200` and looks fine, the evidence is gone once the files are deployed,
and the CDN will happily cache it.

The `onError` hook fires once per failed route as it happens, and then the build reports them together.

All-or-nothing gives a promise a pipeline can lean on:
every file in `dist/<folder>/ssg/` came from a run where every page rendered.
