import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { defaults } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

/**
 * The API program under `kosmo serve`, reloaded by saving files.
 *
 * api/dev.ts here logs when it is evaluated, and its factory builds an app
 * holding a listening socket on a fixed port, logging that too.
 * So the two things a reload must never do both show up:
 * an app built while the previous one is still up cannot bind the port,
 * and an app torn down twice, or not at all, is in the log.
 *
 * The log is a file rather than a variable: every reload evaluates a fresh module instance,
 * and a file is the one channel the test and every instance agree on.
 * */
const ROUTE = "ping";

const logDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-dev-reload-"));
const logFile = resolve(logDir, "program.log");

// free at the time of asking, which is all a test needs
const freePort = () => {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });
};

const port = await freePort();

const devSource = `
  import { appendFileSync } from "node:fs";
  import { createServer } from "node:net";

  import { getRequestListener } from "@hono/node-server";

  import { devSetup } from "${defaults.libPrefix}/api:factory";
  import app from "./app";
  import { tick } from "./tick";

  const log = (event: string) => {
    appendFileSync(${JSON.stringify(logFile)}, event + ":" + tick + "\\n");
  };

  log("load");

  export default devSetup(async () => {
    if (tick === "fail") {
      throw new Error("no app for this tick");
    }

    const socket = createServer();

    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.listen(${port}, "127.0.0.1", () => resolve());
    });

    log("build");

    return {
      requestHandler: getRequestListener(app.fetch),
      async teardownHandler() {
        await new Promise<void>((resolve) => socket.close(() => resolve()));
        // slower than an import, so a load that does not wait for it gets ahead in the log
        await new Promise((resolve) => setTimeout(resolve, 200));
        log("teardown");
      },
    };
  });
`;

// logs when it is evaluated, which is on the first request to it
const routeSource = `
  import { appendFileSync } from "node:fs";
  import { defineRoute } from "${defaults.libPrefix}/api";
  import { tick } from "../tick";
  appendFileSync(${JSON.stringify(logFile)}, "route:" + tick + "\\n");
  export default defineRoute<"${ROUTE}">(({ GET }) => [
    GET((ctx) => ctx.json({ tick })),
  ]);
`;

const tickSource = (value: string) => {
  return `export const tick = ${JSON.stringify(value)};\n`;
};

const project = await setupTestProject({
  mode: "csr",
  frontend: "react",
  backend: "hono",
});

const { createPath } = pathResolver(project.project, project.sourceFolder);

const writeTick = (source: string) => {
  return writeFile(createPath.api("tick.ts"), source, "utf8");
};

const readLog = async (): Promise<Array<string>> => {
  const content = await readFile(logFile, "utf8").catch(() => "");
  return content.split("\n").filter(Boolean);
};

// wait until the log reaches `count` lines, or give up
const waitForLog = async (count: number, timeout = 8000) => {
  const deadline = Date.now() + timeout;
  let lines = await readLog();
  while (lines.length < count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    lines = await readLog();
  }
  return lines;
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 2500));

const servedTick = async () => {
  const { response } = await project.withApiResponse([ROUTE]);
  return [response.statusCode, response.body];
};

/**
 * Chassis reports a skipped reload or a failed build on `console.error`.
 * Captured rather than left to print: the report is behaviour worth asserting,
 * and a suite that logs expected stack traces buries the unexpected ones.
 * */
const reported: Array<string> = [];

const takeReported = () => reported.splice(0).join("\n");

let teardown = async () => {};

beforeAll(async () => {
  vi.spyOn(console, "error").mockImplementation((...args: Array<unknown>) => {
    reported.push(args.map((arg) => String(arg)).join(" "));
  });

  teardown = await project.bootstrapProject(async () => {
    await writeTick(tickSource("1"));
    await writeFile(createPath.api("dev.ts"), devSource, "utf8");
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource;
    });
  });
}, 180_000);

afterAll(async () => {
  await teardown();
  await rm(logDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("backend under kosmo serve", () => {
  test("loads the program on boot, and builds the app with the first request", async () => {
    expect(await waitForLog(1)).toEqual(["load:1"]);
    await settle();
    expect(await readLog()).toEqual(["load:1"]);

    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "1" })]);
    expect(await readLog()).toEqual(["load:1", "build:1", "route:1"]);
  });

  test("a save tears the app down, then loads the next program", async () => {
    const before = await readLog();

    await writeTick(tickSource("2"));

    const log = await waitForLog(before.length + 2);
    expect(log.slice(before.length)).toEqual(["teardown:1", "load:2"]);

    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "2" })]);
    expect((await readLog()).slice(before.length)).toEqual([
      "teardown:1",
      "load:2",
      "build:2",
      "route:2",
    ]);
  });

  test("a program no request reached is replaced with nothing to tear down", async () => {
    const before = await readLog();

    await writeTick(tickSource("3"));
    await waitForLog(before.length + 2);

    await writeTick(tickSource("4"));
    await waitForLog(before.length + 3);

    expect((await readLog()).slice(before.length)).toEqual([
      "teardown:2",
      "load:3",
      "load:4",
    ]);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "4" })]);
  });

  test("saves landing together never put two apps side by side", async () => {
    // two modules of the program, saved at once: two events, however many reloads
    await Promise.all([
      writeTick(tickSource("5")),
      writeFile(createPath.api("dev.ts"), `${devSource}\n// touched\n`, "utf8"),
    ]);
    await settle();

    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "5" })]);

    // each app is torn down once, and before the next one is built;
    // side by side, the second one fails to bind the port and never logs a build
    const apps = (await readLog()).filter((line) => {
      return /^(build|teardown):/.test(line);
    });
    for (const [i, line] of apps.entries()) {
      expect(line.split(":")[0]).toEqual(i % 2 ? "teardown" : "build");
    }

    expect(apps.at(-1)).toEqual("build:5");
    expect(takeReported()).toEqual("");
  });

  test("a save that cannot compile leaves the running program up", async () => {
    const before = await readLog();

    await writeTick("export const tick = ;\n");
    await settle();

    // checked before anything is torn down
    expect(await readLog()).toEqual(before);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "5" })]);

    const errors = takeReported();
    expect(errors).toMatch(/backend reload skipped/);
    expect(errors).toMatch(/tick\.ts/);
  });

  test("the next good save reloads it", async () => {
    const before = await readLog();

    await writeTick(tickSource("6"));

    const log = await waitForLog(before.length + 2);

    expect(log.slice(before.length)).toEqual(["teardown:5", "load:6"]);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "6" })]);
    expect(takeReported()).toEqual("");
  });

  test("an app that fails to build answers 503, reported once", async () => {
    await writeTick(tickSource("fail"));
    await settle();

    expect((await servedTick())[0]).toEqual(503);
    expect((await servedTick())[0]).toEqual(503);

    const failures = takeReported().match(/backend app failed to build/g);
    expect(failures).toHaveLength(1);
  });

  test("and is built again after the save that fixes it", async () => {
    await writeTick(tickSource("6"));
    await settle();

    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "6" })]);
    takeReported();
  });

  test("requests arriving during a reload are answered by the next program", async () => {
    const before = await readLog();
    const answers = new Set<string>();

    let asking = true;

    // teardown takes 200ms here: plenty of requests land while there is no program
    const requests = (async () => {
      while (asking) {
        answers.add((await servedTick()).join(" "));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    })();

    await writeTick(tickSource("7"));
    await waitForLog(before.length + 2);
    await new Promise((resolve) => setTimeout(resolve, 300));

    asking = false;
    await requests;

    // none was refused, and none reached a program that was on its way out
    expect([...answers].sort()).toEqual([
      `200 ${JSON.stringify({ tick: "6" })}`,
      `200 ${JSON.stringify({ tick: "7" })}`,
    ]);
  });

  test("stopping the dev server tears the app down", async () => {
    const before = await readLog();

    await teardown();
    teardown = async () => {};

    expect((await readLog()).slice(before.length)).toEqual(["teardown:7"]);
  });
});
