import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { type BACKENDS, defaults } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

/**
 * API routes under `kosmo serve`, on a folder with a backend only.
 *
 * The app registers every route and imports none:
 * a route file is evaluated on the first request to it.
 * Every route file here logs when it is evaluated and when its chain runs,
 * so what was imported, and when, is read from the log.
 *
 * The log is a file rather than a variable: every reload evaluates fresh module instances,
 * and a file is the one channel the test and every instance agree on.
 * */
type Backend = keyof typeof BACKENDS;

// handler bodies per backend; `ctx` is the handler argument on all three
const respond: Record<Backend, (body: string) => string> = {
  hono: (body) => `return ctx.json(${body});`,
  h3: (body) => `return ${body};`,
  koa: (body) => `ctx.body = ${body};`,
};

for (const backend of ["hono", "koa", "h3"] as const) {
  describe(backend, async () => {
    const logDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-lazy-routes-"));
    const logFile = resolve(logDir, "routes.log");

    const project = await setupTestProject({ mode: "csr", backend });

    const { createPath } = pathResolver(project.project, project.sourceFolder);

    const header = (name: string) => `
      import { appendFileSync } from "node:fs";
      import { defineRoute, use } from "${defaults.libPrefix}/api";
      const log = (line: string) => {
        appendFileSync(${JSON.stringify(logFile)}, line + "\\n");
      };
      log("load:${name}");
    `;

    // GET validates its query, POST answers with `reply`
    const routeSource = (
      name: string,
      { reply = name, methods = "GET, POST" } = {},
    ) => `
      ${header(name)}
      export default defineRoute<"${name}">(({ ${methods} }) => [
        GET<{ query: { page: VRefine<number, { minimum: 1 }> } }>(async (ctx) => {
          log("run:${name}");
          ${respond[backend]("{ page: ctx.validated.query.page }")}
        }),
        ${
          methods.includes("POST")
            ? `POST(async (ctx) => { ${respond[backend](`{ reply: "${reply}" }`)} }),`
            : ""
        }
      ]);
    `;

    const useSource = (name: string) => `
      ${header(name)}
      export type UseT = {};
      export default [
        use<UseT>(async (ctx, next) => {
          log("run:${name}");
          return next();
        }),
      ];
    `;

    // the array is returned from a block, so its methods cannot be read from the file
    const unreadableSource = (name: string) => `
      ${header(name)}
      export default defineRoute<"${name}">(({ GET }) => {
        return [GET(async (ctx) => { ${respond[backend](`{ reply: "${name}" }`)} })];
      });
    `;

    const writeRoute = async (file: string, source: string) => {
      await mkdir(dirname(createPath.api(file)), { recursive: true });
      await writeFile(createPath.api(file), source, "utf8");
    };

    const readLog = async (): Promise<Array<string>> => {
      const content = await readFile(logFile, "utf8").catch(() => "");
      return content.split("\n").filter(Boolean);
    };

    const loaded = async () => {
      return (await readLog())
        .filter((line) => line.startsWith("load:"))
        .sort();
    };

    const api = async (
      route: string,
      options?: Parameters<typeof project.withApiResponse>[1],
    ) => {
      const { response } = await project.withApiResponse([route], options);
      return [response.statusCode, response.body];
    };

    // a save takes a moment to reach the program: ask until the answer is the expected one
    const eventually = async (
      route: string,
      options: Parameters<typeof project.withApiResponse>[1],
      expected: [status: number, body: string],
    ) => {
      const deadline = Date.now() + 8000;
      let answer = await api(route, options);
      while (
        JSON.stringify(answer) !== JSON.stringify(expected) &&
        Date.now() < deadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        answer = await api(route, options);
      }
      return answer;
    };

    /**
     * Chassis and the routes module report what fails on `console.error`.
     * Captured rather than left to print: the report is behaviour worth asserting,
     * and a suite that logs expected stack traces buries the unexpected ones.
     * */
    const reported: Array<string> = [];

    const takeReported = () => reported.splice(0).join("\n");

    let teardown = async () => {};

    beforeAll(async () => {
      vi.spyOn(console, "error").mockImplementation(
        (...args: Array<unknown>) => {
          reported.push(args.map((arg) => String(arg)).join(" "));
        },
      );

      teardown = await project.bootstrapProject(async () => {
        await writeRoute("shop/use.ts", useSource("shop/use"));
        await writeRoute("shop/items/index.ts", routeSource("shop/items"));
        await writeRoute(
          "shop/orders/index.ts",
          routeSource("shop/orders", { methods: "GET" }),
        );
        await writeRoute("legacy/index.ts", unreadableSource("legacy"));
      });
    }, 180_000);

    afterAll(async () => {
      await teardown();
      await rm(logDir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    test("starts with no route imported", async () => {
      expect(await loaded()).toEqual([]);
    });

    test("a route whose methods cannot be read is not registered", async () => {
      expect((await api("legacy"))[0]).toEqual(404);
      expect(await loaded()).toEqual([]);
    });

    test("an unloaded route answers 405 by its declared methods, still unloaded", async () => {
      const { response } = await project.withApiResponse(["shop/orders"], {
        method: "POST",
      });

      expect(response.statusCode).toEqual(405);
      expect(response.headers.allow).toEqual("GET, OPTIONS, HEAD");
      expect(await loaded()).toEqual([]);
    });

    test("the first request imports the route and runs its whole chain", async () => {
      expect(await api("shop/items", { searchParams: { page: 2 } })).toEqual([
        200,
        `{"page":2}`,
      ]);

      // imported side by side, in no particular order
      expect(await loaded()).toEqual(["load:shop/items", "load:shop/use"]);

      // cascading middleware first, then the route - and its validation ran, `page` is a number
      expect((await readLog()).filter((e) => e.startsWith("run:"))).toEqual([
        "run:shop/use",
        "run:shop/items",
      ]);
    });

    test("later requests, on any method, import nothing", async () => {
      expect(await api("shop/items", { searchParams: { page: 3 } })).toEqual([
        200,
        `{"page":3}`,
      ]);
      expect(await api("shop/items", { method: "POST" })).toEqual([
        200,
        `{"reply":"shop/items"}`,
      ]);

      expect(await loaded()).toEqual(["load:shop/items", "load:shop/use"]);
    });

    test("validation of a lazy route rejects what the eager one would", async () => {
      const [status] = await api("shop/items", { searchParams: { page: 0 } });
      expect(status).toEqual(400);
    });

    test("a new route file is served without a restart", async () => {
      await writeRoute("shop/fresh/index.ts", routeSource("shop/fresh"));

      expect(
        await eventually("shop/fresh", { method: "POST" }, [
          200,
          `{"reply":"shop/fresh"}`,
        ]),
      ).toEqual([200, `{"reply":"shop/fresh"}`]);
    });

    test("a method added to a route nothing has requested is registered", async () => {
      expect(await loaded()).not.toContain("load:shop/orders");

      await writeRoute("shop/orders/index.ts", routeSource("shop/orders"));

      expect(
        await eventually("shop/orders", { method: "POST" }, [
          200,
          `{"reply":"shop/orders"}`,
        ]),
      ).toEqual([200, `{"reply":"shop/orders"}`]);
    });

    test("a save of a loaded route is served on the next request", async () => {
      await writeRoute(
        "shop/items/index.ts",
        routeSource("shop/items", { reply: "edited" }),
      );

      expect(
        await eventually("shop/items", { method: "POST" }, [
          200,
          `{"reply":"edited"}`,
        ]),
      ).toEqual([200, `{"reply":"edited"}`]);
    });

    test("a route that cannot compile is down alone", async () => {
      await writeRoute("shop/items/index.ts", "export default ;\n");

      const deadline = Date.now() + 8000;
      let [status] = await api("shop/items", { method: "POST" });
      while (status === 200 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        [status] = await api("shop/items", { method: "POST" });
      }

      expect(status).toBeGreaterThanOrEqual(400);
      expect(await api("shop/orders", { method: "POST" })).toEqual([
        200,
        `{"reply":"shop/orders"}`,
      ]);
      takeReported();
    });

    test("and is back with the save that fixes it", async () => {
      await writeRoute("shop/items/index.ts", routeSource("shop/items"));

      expect(
        await eventually("shop/items", { method: "POST" }, [
          200,
          `{"reply":"shop/items"}`,
        ]),
      ).toEqual([200, `{"reply":"shop/items"}`]);
    });

    test("a route importing a file that does not exist fails its own requests", async () => {
      await writeRoute(
        "shop/adrift/index.ts",
        `import "./missing";\n${routeSource("shop/adrift")}`,
      );

      // registered by its methods, so the failure is met by the request that imports it
      const deadline = Date.now() + 8000;
      let [status] = await api("shop/adrift", { method: "POST" });
      while (status !== 500 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        [status] = await api("shop/adrift", { method: "POST" });
      }

      expect(status).toEqual(500);
      expect(await api("shop/orders", { method: "POST" })).toEqual([
        200,
        `{"reply":"shop/orders"}`,
      ]);
    });

    test("and is served once the import is gone", async () => {
      await writeRoute("shop/adrift/index.ts", routeSource("shop/adrift"));

      expect(
        await eventually("shop/adrift", { method: "POST" }, [
          200,
          `{"reply":"shop/adrift"}`,
        ]),
      ).toEqual([200, `{"reply":"shop/adrift"}`]);
    });
  });
}
