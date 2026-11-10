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
 * api/dev.ts here holds a listening socket on a fixed port and logs its own lifecycle,
 * so the two things a reload must never do both show up:
 * a program evaluated while the previous one is still up cannot bind the port,
 * and a program torn down twice, or not at all, is in the log.
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

  const socket = createServer();

  await new Promise<void>((resolve, reject) => {
    socket.once("error", reject);
    socket.listen(${port}, "127.0.0.1", () => resolve());
  });

  log("load");

  export default devSetup({
    requestHandler() {
      return getRequestListener(app.fetch);
    },
    async teardownHandler() {
      await new Promise<void>((resolve) => socket.close(() => resolve()));
      // slower than an import, so a load that does not wait for it gets ahead in the log
      await new Promise((resolve) => setTimeout(resolve, 200));
      log("teardown");
    },
  });
`;

const routeSource = `
  import { defineRoute } from "${defaults.libPrefix}/api";
  import { tick } from "../tick";
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
 * Chassis reports a skipped or failed reload on `console.error`.
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
  test("loads the program once, on boot", async () => {
    expect(await waitForLog(1)).toEqual(["load:1"]);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "1" })]);
  });

  test("a save tears the program down, then loads the next one", async () => {
    await writeTick(tickSource("2"));

    expect(await waitForLog(3)).toEqual(["load:1", "teardown:1", "load:2"]);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "2" })]);
  });

  test("saves landing together never put two programs side by side", async () => {
    // two modules of the program, saved at once: two events, however many reloads
    await Promise.all([
      writeTick(tickSource("3")),
      writeFile(createPath.api("dev.ts"), `${devSource}\n// touched\n`, "utf8"),
    ]);
    await settle();

    const log = await readLog();

    // each program is torn down once, and before the next one is evaluated;
    // side by side, the second one fails to bind the port and never logs a load
    expect(log.length % 2).toEqual(1);
    for (const [i, line] of log.entries()) {
      expect(line.split(":")[0]).toEqual(i % 2 ? "teardown" : "load");
    }

    expect(log.at(-1)).toEqual("load:3");
    expect(takeReported()).toEqual("");
  });

  test("a save that cannot compile leaves the running program up", async () => {
    const before = await readLog();

    await writeTick("export const tick = ;\n");
    await settle();

    // checked before anything is torn down
    expect(await readLog()).toEqual(before);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "3" })]);

    const errors = takeReported();
    expect(errors).toMatch(/backend reload skipped/);
    expect(errors).toMatch(/tick\.ts/);
  });

  test("the next good save reloads it", async () => {
    const before = await readLog();

    await writeTick(tickSource("4"));

    const log = await waitForLog(before.length + 2);

    expect(log.slice(before.length)).toEqual(["teardown:3", "load:4"]);
    expect(await servedTick()).toEqual([200, JSON.stringify({ tick: "4" })]);
    expect(takeReported()).toEqual("");
  });

  test("stopping the dev server tears the program down", async () => {
    const before = await readLog();

    await teardown();
    teardown = async () => {};

    expect((await readLog()).slice(before.length)).toEqual(["teardown:4"]);
  });
});
