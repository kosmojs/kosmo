import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { posix, resolve } from "node:path";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
} from "vitest";

import { pathResolver } from "@kosmojs/lib";

import { pkgsDir } from "..";
import {
  type Exit,
  getJSON,
  isAlive,
  isPortFree,
  killAll,
  type NodeProcess,
  sleep,
  spawnNode,
  waitFor,
} from "../processes";
import { setupTestProject } from "../setup";

/**
 * `kosmo preview`: a production build served by `dist/run.js` in a child process,
 * the runner, replaced by a fresh one after every rebuild.
 *
 * Preview runs here in a process of its own, as the cli worker does under the supervisor;
 * standalone, it owns the process and exits it.
 * The test holds the IPC channel the supervisor would hold, so closing it is one more way to stop.
 *
 * Every runner logs its pid when it loads the route,
 * so the log lists every runner there ever was, and each one can be checked for being gone.
 * The log is a file outside the project: the one channel the test and every runner agree on.
 * */
const ROUTE = "probe";

const worker = resolve(pkgsDir, "cli/pkg/worker.js");

const logDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-dev-preview-"));
const logFile = resolve(logDir, "runners.log");

const routeSource = `
  import { appendFileSync } from "node:fs";
  import { defineRoute } from "_/api";
  import { tick } from "../tick";

  appendFileSync(${JSON.stringify(logFile)}, process.pid + ":" + tick + "\\n");

  export default defineRoute<"${ROUTE}">(({ GET }) => [
    GET((ctx) => ctx.json({ tick, pid: process.pid, ppid: process.ppid })),
  ]);
`;

const tickSource = (value: string) => {
  return `export const tick = ${JSON.stringify(value)};\n`;
};

const project = await setupTestProject({ backend: "hono" });

const { createPath } = pathResolver(project.project, project.sourceFolder);

const { root, previewHost } = project.project;
const [host, port] = previewHost.split(":");

const url = `http://${previewHost}${posix.join(
  project.sourceFolder.config.backend?.base || "/",
  ROUTE,
)}`;

type Served = { tick: string; pid: number; ppid: number };

const writeTick = (source: string) => {
  return writeFile(createPath.api("tick.ts"), source, "utf8");
};

// every runner that ever loaded, oldest first
const loggedRunners = async (): Promise<Array<number>> => {
  const content = await readFile(logFile, "utf8").catch(() => "");
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => Number(line.split(":")[0]));
};

const liveRunners = async () => {
  const live: Array<number> = [];
  for (const pid of new Set(await loggedRunners())) {
    if (await isAlive(pid)) {
      live.push(pid);
    }
  }
  return live;
};

// waits for the runner to serve `tick`, or anything at all when `tick` is omitted
const waitForServed = (tick?: string, timeout = 60_000) => {
  return waitFor(
    async () => {
      const served = await getJSON<Served>(url);
      return served && (tick === undefined || served.tick === tick)
        ? served
        : undefined;
    },
    { timeout, message: `runner serving ${tick ?? "anything"} on ${url}` },
  );
};

// output written since `mark`, an earlier length of it
const outputSince = (preview: NodeProcess, mark: number) => {
  return preview.output().slice(mark);
};

/**
 * Waits for preview to go quiet: no output for `idle` ms.
 * Rebuilds and runner restarts all log, so quiet means the rebuild loop is done.
 * */
const settle = async (preview: NodeProcess, idle = 2_000) => {
  let length = -1;
  await waitFor(
    async () => {
      const current = preview.output().length;
      if (current === length) {
        return true;
      }
      length = current;
      await sleep(idle);
      return false;
    },
    { timeout: 60_000, message: "preview to go quiet" },
  );
};

/**
 * Starts preview and waits for its own runner to serve.
 * A runner some earlier preview left behind would answer just as well,
 * so the one serving has to be a child of this preview.
 * */
const startPreview = async () => {
  const preview = spawnNode([worker, "preview"], root);
  const served = await waitFor(
    async () => {
      const served = await getJSON<Served>(url);
      return served?.ppid === preview.pid ? served : undefined;
    },
    // the first build runs before anything listens
    { timeout: 120_000, message: `a runner of preview ${preview.pid}` },
  );
  return { preview, served };
};

// the runner is gone, and so is anything listening on its port
const expectNoRunner = async () => {
  await waitFor(async () => (await liveRunners()).length === 0, {
    timeout: 5_000,
    message: "every runner to exit",
  }).catch(() => {});
  expect(await liveRunners()).toEqual([]);
  expect(await isPortFree(host, Number(port))).toBe(true);
};

let teardown = async () => {};

beforeAll(async () => {
  teardown = await project.bootstrapProject(async () => {
    await writeTick(tickSource("1"));
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource;
    });
  });
}, 180_000);

afterAll(async () => {
  await killAll(await loggedRunners());
  await teardown();
  await rm(logDir, { recursive: true, force: true });
});

describe("runner under kosmo preview", { timeout: 60_000 }, () => {
  let preview: NodeProcess;
  let served: Served;

  beforeAll(async () => {
    ({ preview, served } = await startPreview());
  }, 120_000);

  test("boots a single runner, a child of preview", async () => {
    expect(served).toMatchObject({ tick: "1", ppid: preview.pid });
    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("a save replaces the runner, the previous one exits", async () => {
    const previous = served.pid;

    await writeTick(tickSource("2"));
    served = await waitForServed("2");

    expect(served.pid).not.toEqual(previous);
    expect(await isAlive(previous)).toBe(false);
    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("saves landing together leave a single runner", async () => {
    await Promise.all([
      writeTick(tickSource("3")),
      writeFile(
        createPath.api(`${ROUTE}/index.ts`),
        `${routeSource}\n// touched\n`,
        "utf8",
      ),
    ]);

    await waitForServed("3");
    await settle(preview);

    served = await waitForServed("3");

    // however many rebuilds the burst took, the last runner started is the one left
    expect((await loggedRunners()).at(-1)).toEqual(served.pid);
    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("a save that fails to build keeps the runner serving", async () => {
    const mark = preview.output().length;

    await writeTick("export const tick = ;\n");

    await waitFor(
      () => {
        return outputSince(preview, mark).includes(
          "keeping previous build running",
        );
      },
      { message: "the failed build to be reported" },
    );

    expect(outputSince(preview, mark)).toMatch(/build failed/);
    expect(await waitForServed("3")).toEqual(served);
    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("the next good save replaces it", async () => {
    const previous = served.pid;

    await writeTick(tickSource("4"));
    served = await waitForServed("4");

    expect(served.pid).not.toEqual(previous);
    expect(await isAlive(previous)).toBe(false);
    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("a runner that dies is started again by the next save", async () => {
    const mark = preview.output().length;

    process.kill(served.pid, "SIGKILL");

    await waitFor(
      () => outputSince(preview, mark).includes("runner exited (SIGKILL)"),
      { message: "the dead runner to be reported" },
    );

    expect(await isAlive(preview.pid)).toBe(true);
    expect(await isPortFree(host, Number(port))).toBe(true);

    await writeTick(tickSource("5"));
    served = await waitForServed("5");

    expect(await liveRunners()).toEqual([served.pid]);
  });

  test("SIGTERM stops preview and its runner", async () => {
    preview.proc.kill("SIGTERM");

    expect(await preview.waitForExit()).toEqual({ code: 0, signal: null });
    await expectNoRunner();
  });
});

describe("stopping kosmo preview", { timeout: 150_000 }, () => {
  // a runner a failed test left behind would hold the port for the next one
  beforeEach(() => {
    onTestFinished(async () => killAll(await liveRunners()));
  });

  const stops: Array<
    [name: string, stop: (preview: NodeProcess) => void, exit: Exit]
  > = [
    [
      "SIGINT, as Ctrl-C sends it",
      (preview) => preview.proc.kill("SIGINT"),
      { code: 0, signal: null },
    ],
    [
      "its parent going away, the IPC channel closing",
      (preview) => preview.proc.disconnect(),
      { code: 0, signal: null },
    ],
    // no handler runs: the runner learns it from its own IPC channel closing
    [
      "SIGKILL",
      (preview) => preview.proc.kill("SIGKILL"),
      { code: null, signal: "SIGKILL" },
    ],
  ];

  for (const [name, stop, exit] of stops) {
    test(`${name} leaves no runner behind`, async () => {
      const { preview } = await startPreview();

      stop(preview);

      expect(await preview.waitForExit()).toEqual(exit);
      await expectNoRunner();
    });
  }

  test("stopping mid-rebuild starts no runner", async () => {
    const { preview } = await startPreview();
    const mark = preview.output().length;

    await writeTick(tickSource("6"));

    await waitFor(() => outputSince(preview, mark).includes("rebuilding"), {
      message: "the rebuild to start",
    });

    preview.proc.kill("SIGTERM");

    expect(await preview.waitForExit()).toEqual({ code: 0, signal: null });

    // long enough for a runner the build would have started to log its load
    await sleep(2_000);

    await expectNoRunner();
  });
});
