---
title: Frontend Testing
description: Drive a real browser against a real server -
    no DOM shim, no snapshot standing in for the page.
head:
  - - meta
    - name: keywords
      content: frontend testing
---

A frontend test in KosmoJS drives a real browser against a real server.
No DOM shim stands in for the page, and no rendered string pretends to be the render -
the test navigates to a live URL and asserts on what comes back.

It is the same transport trick the backend harness uses, seen from the other end.
The dev server that normally serves your pages is started on a random port for the duration of the run,
and `page.href()` hands you its address.

Frontend testing can be configured per source folder in `kosmo.config.ts`:

~~~ts
export default defineConfig({
  frontend: {
    // ...
    test: true, // [!code hl]
  },
});
~~~

Enabled by default; set `test: false` to disable testing entirely.
Or set `test: { seed: false }` to keep the harness and write the files yourself.

## The test option

The option has the same shape on `frontend` and `backend`, with seeding on by default once testing is enabled.

The one difference is where files land. Frontend seeding writes a starter `index.test.ts` beside each route in `pages/` dir.

<!-- @include: ../parts/testing/options.md -->

## The seed option

<!-- @include: ../parts/testing/seed.md -->

## The harness

`_/test/pages` exports `prepareHarness`. Hand it a route name and it returns the pieces a browser test needs:

~~~ts
import { describe, test } from "vitest";

import { prepareHarness } from "_/test/pages";
import { browser } from "./browser";

const { page, pages, route, base } = await prepareHarness("account");

describe(route, () => {
  test(route, async () => {
    const tab = await browser.newPage();
    await tab.goto(page.href());
  });
});
~~~

- `page` - the current page, with `href()` for building its URL
- `pages` - every other page, keyed by route name
- `route` - the route name you passed in
- `base` - the origin the harness is serving from

## Navigating with `page.href()`

`href()` is the usual way in. It returns an absolute URL on the harness's origin, typed against the route's own params:

~~~ts
href: (params?: [id: string | number], query?: Record<string, unknown>)
~~~

Pass a params tuple for dynamic segments, and an optional query object for everything else:

~~~ts
const tab = await browser.newPage();
await tab.goto(page.href());
~~~

The backend harness never gives you a URL, because there is nothing to navigate to.
<span class="text-nowrap">On frontend</span>, the URL is the whole point -
it carry the port the disposable server is listening on.

## The base property

`base` is the origin requests go to - something like `http://127.0.0.1:20557`.
The port is drawn at random for each run; the host comes from the [kosmo.devHost](/essentials/config#project-settings-package-json) key in `package.json`.

You will rarely reach for it directly. `page.href()` already composes `base` with the route's path,
params, and query, and that covers almost every test.

Use `base` yourself only when you need to build a URL the harness does not model -
a static asset, an absolute link, a target outside the route tree.

## Other routes via pages property

`pages` lets a single test touch a page other than the current one, without spinning up a second harness:

~~~ts
import { prepareHarness } from "_/test/pages";

const { pages, route } = await prepareHarness("account");

test(route, async () => {
  const tab = await browser.newPage();
  await tab.goto(pages["another/page"].href());
});
~~~

Same origin, same server, no extra setup.

## What you bring yourself

**The browser.** KosmoJS will not choose one for you. Launch Playwright, Puppeteer,
or whichever driver you prefer in your test setup, and point it at the URLs the harness produces.
The harness owns the server, not the client.

**Header helpers.** `withHeaders`, `setHeaders`, and `clearHeaders` have no frontend counterpart.
In a browser, headers and cookies belong to the browser - set them through the driver's own API,
or carry state through `page.href()`'s query argument.

## Running tests

<!-- @include: ../parts/testing/running-tests.md -->
