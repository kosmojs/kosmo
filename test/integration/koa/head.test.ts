import { describe, test } from "vitest";

import { setupTestProject } from "../setup";

/**
 * @koa/router registers every GET for HEAD as well and runs matching layers
 * in registration order, so a HEAD handler must be registered ahead of its path's GET
 * whatever order the route defines them in.
 * Handlers tag responses with x-handler, since a HEAD response carries no body.
 * */
const routes: Record<string, string> = {
  // HEAD defined after GET
  about: `({ GET, HEAD }) => [
    GET((ctx) => { ctx.set("x-handler", "about-get"); ctx.body = "about"; }),
    HEAD((ctx) => { ctx.set("x-handler", "about-head"); ctx.status = 200; }),
  ]`,

  // HEAD defined before GET
  status: `({ GET, HEAD }) => [
    HEAD((ctx) => { ctx.set("x-handler", "status-head"); ctx.status = 200; }),
    GET((ctx) => { ctx.set("x-handler", "status-get"); ctx.body = "status"; }),
  ]`,

  // no HEAD handler: the GET answers HEAD requests
  ping: `({ GET }) => [
    GET((ctx) => { ctx.set("x-handler", "ping-get"); ctx.body = "pong"; }),
  ]`,

  // a static path next to a dynamic one that also matches it;
  // only the dynamic one has a HEAD handler, which must not take over the static path
  "users/me": `({ GET }) => [
    GET((ctx) => { ctx.set("x-handler", "me-get"); ctx.body = "me"; }),
  ]`,
  "users/[id]": `({ GET, HEAD }) => [
    GET((ctx) => { ctx.set("x-handler", "user-get"); ctx.body = "user"; }),
    HEAD((ctx) => { ctx.set("x-handler", "user-head"); ctx.status = 200; }),
  ]`,
};

const requests: Array<{
  route: string;
  params?: Record<string, string>;
  method: "GET" | "HEAD";
  handler: string;
}> = [
  { route: "about", method: "HEAD", handler: "about-head" },
  { route: "about", method: "GET", handler: "about-get" },
  { route: "status", method: "HEAD", handler: "status-head" },
  { route: "status", method: "GET", handler: "status-get" },
  { route: "ping", method: "HEAD", handler: "ping-get" },
  { route: "users/me", method: "HEAD", handler: "me-get" },
  {
    route: "users/[id]",
    params: { id: "7" },
    method: "HEAD",
    handler: "user-head",
  },
  {
    route: "users/[id]",
    params: { id: "7" },
    method: "GET",
    handler: "user-get",
  },
];

describe("koa: HEAD handlers", async ({ afterAll }) => {
  const { bootstrapProject, createApiRoutes, withApiResponse } =
    await setupTestProject({ backend: "koa" });

  const teardown = await bootstrapProject(async () => {
    await createApiRoutes(
      Object.keys(routes).map((name) => ({ name })),
      async ({ name }) => {
        return () => `
          import { defineRoute } from "_/api";
          export default defineRoute(${routes[name]});
        `;
      },
    );
  });

  afterAll(teardown);

  for (const { route, params, method, handler } of requests) {
    test(`${method} ${route} -> ${handler}`, async ({ expect }) => {
      const { response } = await withApiResponse([route, params], { method });
      expect(response.statusCode).toBe(200);
      expect(response.headers["x-handler"]).toBe(handler);
    });
  }
});
