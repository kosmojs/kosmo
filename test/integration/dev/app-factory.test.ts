import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type BACKENDS, defaults } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

/**
 * `appFactory` under `kosmo serve`, on a folder with a backend only.
 *
 * The dev server builds the app on the first API request,
 * and a route file is imported by the first request to that route.
 * Every route file here logs when it is evaluated, so what was imported, and when,
 * is read from the log.
 *
 * The log is a file rather than a variable: every reload evaluates fresh module instances,
 * and a file is the one channel the test and every instance agree on.
 * */
type Backend = keyof typeof BACKENDS;

// a handler answering `{ reply }`; `ctx` is the handler argument on all three
const respond: Record<Backend, (reply: string) => string> = {
  hono: (reply) => `return ctx.json({ reply: "${reply}" });`,
  h3: (reply) => `return { reply: "${reply}" };`,
  koa: (reply) => `ctx.body = { reply: "${reply}" };`,
};

// an appFactory callback registering GET `path`, answering `{ reply }`
const callback: Record<Backend, (path: string, reply: string) => string> = {
  hono: (path, reply) => `({ app }) => {
    app.get("${path}", (ctx) => ctx.json({ reply: "${reply}" }));
  }`,
  h3: (path, reply) => `({ app }) => {
    app.on("GET", "${path}", () => ({ reply: "${reply}" }));
  }`,
  koa: (path, reply) => `({ router }) => {
    router.get("${path}", (ctx) => { ctx.body = { reply: "${reply}" }; });
  }`,
};

for (const backend of ["hono", "koa", "h3"] as const) {
  describe(backend, async () => {
    const logDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-app-factory-"));
    const logFile = resolve(logDir, "routes.log");

    const project = await setupTestProject({ mode: "csr", backend });

    const { createPath } = pathResolver(project.project, project.sourceFolder);

    const base = project.sourceFolder.config.backend?.base as string;

    const appSource = `
      import appFactory from "${defaults.libPrefix}/api:factory";
      export default appFactory(
        ${callback[backend](`${base}/shop/custom`, "callback")},
      );
    `;

    const routeSource = (name: string) => `
      import { appendFileSync } from "node:fs";
      import { defineRoute } from "${defaults.libPrefix}/api";
      appendFileSync(${JSON.stringify(logFile)}, "load:${name}\\n");
      export default defineRoute<"${name}">(({ GET }) => [
        GET(async (ctx) => { ${respond[backend](name)} }),
      ]);
    `;

    const writeRoute = async (file: string, source: string) => {
      await mkdir(dirname(createPath.api(file)), { recursive: true });
      await writeFile(createPath.api(file), source, "utf8");
    };

    const loaded = async (): Promise<Array<string>> => {
      const content = await readFile(logFile, "utf8").catch(() => "");
      return content.split("\n").filter(Boolean).sort();
    };

    const api = async (route: string) => {
      const { response } = await project.withApiResponse([route]);
      return [response.statusCode, response.body];
    };

    // a save takes a moment to reach the program: ask until the answer is the expected one
    const eventually = async (
      route: string,
      expected: [status: number, body: string],
    ) => {
      const deadline = Date.now() + 8000;
      let answer = await api(route);
      while (
        JSON.stringify(answer) !== JSON.stringify(expected) &&
        Date.now() < deadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        answer = await api(route);
      }
      return answer;
    };

    let teardown = async () => {};

    beforeAll(async () => {
      teardown = await project.bootstrapProject(async () => {
        await writeFile(createPath.api("app.ts"), appSource, "utf8");
        await writeRoute("shop/items/index.ts", routeSource("shop/items"));
        await writeRoute("shop/custom/index.ts", routeSource("shop/custom"));
      });
    }, 180_000);

    afterAll(async () => {
      await teardown();
      await rm(logDir, { recursive: true, force: true });
    });

    test("starts with no route imported", async () => {
      expect(await loaded()).toEqual([]);
    });

    test("the first request imports the route it is for, and no other", async () => {
      expect(await api("shop/items")).toEqual([200, `{"reply":"shop/items"}`]);
      expect(await loaded()).toEqual(["load:shop/items"]);
    });

    test("a route registered in the callback takes the place of the route file", async () => {
      expect(await api("shop/custom")).toEqual([200, `{"reply":"callback"}`]);
      // never reached, so never imported
      expect(await loaded()).toEqual(["load:shop/items"]);
    });

    test("a new route file is served without a restart", async () => {
      await writeRoute("shop/fresh/index.ts", routeSource("shop/fresh"));

      expect(
        await eventually("shop/fresh", [200, `{"reply":"shop/fresh"}`]),
      ).toEqual([200, `{"reply":"shop/fresh"}`]);
    });
  });
}
