---
title: Backend Testing
description: Run your API routes through the real stack -
    routing, middleware, validation, error handling -
    with no network, no server, and no mocks.
head:
  - - meta
    - name: keywords
      content: backend testing
---

Backend testing in KosmoJS runs your API routes through the real stack with no network, no running server, and no mocks.

The same in-process dispatch that lets an isomorphic fetch client call your backend during SSR is pointed at your test runner instead.

This is possible because KosmoJS already keeps the client/server boundary as an HTTP call that costs nothing on the server.
Tests reuse that path rather than re-implementing it.

Testing is **disabled by default**. Enable it per source folder in `kosmo.config.ts`:

~~~ts
export default defineConfig({
  backend: {
    test: true, // [!code hl]
  },
});
~~~

## The test option

The option signature is identical on `backend` and `frontend`:

The one difference is where files land. Backend seeding writes a starter `index.test.ts` beside each route in `api/` dir.

<!-- @include: ../parts/testing/options.md -->

## The seed option

<!-- @include: ../parts/testing/seed.md -->

## The harness

`_/test/api` exports `prepareHarness`. Pass it a route name and it returns a client bound to that route.

~~~ts
import { describe, test } from "vitest";

import { prepareHarness } from "_/test/api";

const { client, clients, route } = await prepareHarness("account");

describe(route, () => {
  test.todo(route);
});
~~~

`client.<method>` never throws. It returns the `{ body, response }` object so you can assert on payload and status together.
It also never follows redirects - a redirect comes back as a response you can inspect, not as a silent second request.

~~~ts
const { body, response } = await client.POST([], { json: { some: "data" } });

expect(response.status).toEqual(200);
expect(body).toMatch("...");
~~~

## Scoped headers

`withHeaders` runs a callback with headers merged over whatever is already in scope.
Use it to test an authenticated subtree without mutating module state.

~~~ts
import { prepareHarness, withHeaders } from "_/test/api";

const { client, route } = await prepareHarness("account");

test(route, async () => {
  await withHeaders({ authorization: "Bearer test" }, async () => {
    await client.GET();
  });
});
~~~

`setHeaders` applies headers to every call in the file. `clearHeaders` is the way back.

~~~ts
import { setHeaders } from "_/test/api";

// For every test in the file.
setHeaders({ authorization: "Bearer test" });

describe("...");
~~~

## Calling other routes

`prepareHarness` also returns `clients` for the case where an inner route needs to be called alongside the current one.

~~~ts
import { prepareHarness } from "_/test/api";

const { clients, route } = await prepareHarness("account");

test(route, async () => {
  const { body, response } = await clients["another/route"].GET();
  // ...
});
~~~

Use `clients` when a test needs to exercise a sibling or nested route without leaving the harness.
The same transport swap applies, so these calls also stay in-process.

## Running tests

<!-- @include: ../parts/testing/running-tests.md -->
