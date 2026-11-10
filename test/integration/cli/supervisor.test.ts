import { appendFile, readFile, writeFile } from "node:fs/promises";
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
import { kosmoBin } from ".";

/**
 * The cli supervisor: `kosmo serve` / `kosmo preview` run in a worker process,
 * restarted when a file read only on startup changes, and stopped along with the supervisor.
 *
 * The route reports the process serving it and that process's parent,
 * which is all it takes to tell the tree apart:
 * - under serve, the API runs in the worker, so that is the worker and the supervisor;
 * - under preview, it runs in the runner, so that is the runner and the worker.
 * */
const ROUTE = "probe";

const routeSource = `
  import { defineRoute } from "_/api";
  export default defineRoute<"${ROUTE}">(({ GET }) => [
    GET((ctx) => {
      return ctx.json({
        pid: process.pid,
        ppid: process.ppid,
        env: process.env.PROBE_ENV ?? null,
      });
    }),
  ]);
`;

const project = await setupTestProject({ backend: "hono" });

const { createPath } = pathResolver(project.project, project.sourceFolder);

const { root, devHost, previewHost } = project.project;

const routePath = posix.join(
  project.sourceFolder.config.backend?.base || "/",
  ROUTE,
);

type Served = { pid: number; ppid: number; env: string | null };

type Command = "serve" | "preview";

const hostOf = (command: Command) => {
  return command === "serve" ? devHost : previewHost;
};

const served = (command: Command) => {
  return getJSON<Served>(`http://${hostOf(command)}${routePath}`);
};

// waits for a response matching `match`
const waitForServed = (
  command: Command,
  match: (served: Served) => boolean,
  timeout = 60_000,
) => {
  return waitFor(
    async () => {
      const response = await served(command);
      return response && match(response) ? response : undefined;
    },
    { timeout, message: `kosmo ${command} to serve the expected process` },
  );
};

const portFree = (command: Command) => {
  const [host, port] = hostOf(command).split(":");
  return isPortFree(host, Number(port));
};

const configFile = createPath.src("kosmo.config.ts");

const touch = (file: string) => appendFile(file, "\n");

// output written since `mark`, an earlier length of it
const outputSince = (supervisor: NodeProcess, mark: number) => {
  return supervisor.output().slice(mark);
};

/**
 * Starts the supervisor and waits for its worker to serve.
 * Under serve the worker is the API process; under preview it is the runner's parent.
 * */
const startSupervisor = async (
  command: Command,
  opts?: { group?: boolean },
) => {
  const supervisor = spawnNode([kosmoBin, command], root, opts);
  const response = await waitForServed(
    command,
    ({ ppid }) => command === "preview" || ppid === supervisor.pid,
    // preview builds before anything listens
    120_000,
  );
  const worker = command === "serve" ? response.pid : response.ppid;
  return { supervisor, worker, served: response };
};

// every given process is gone, and nothing listens where they served
const expectGone = async (command: Command, pids: Array<number>) => {
  const alive = async () => {
    const live: Array<number> = [];
    for (const pid of pids) {
      if (await isAlive(pid)) {
        live.push(pid);
      }
    }
    return live;
  };
  // a worker that lost its supervisor gives its teardown up to 4s
  await waitFor(async () => (await alive()).length === 0, {
    timeout: 6_000,
    message: `processes ${pids.join(", ")} to exit`,
  }).catch(() => {});
  expect(await alive()).toEqual([]);
  expect(await portFree(command)).toBe(true);
};

let teardown = async () => {};

beforeAll(async () => {
  teardown = await project.bootstrapProject(async () => {
    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => routeSource;
    });
  });
}, 180_000);

afterAll(async () => {
  await killAll();
  await teardown();
});

// a process a failed test left behind would hold the port for the next one
const killLeftovers = (pids: () => Array<number>) => {
  beforeEach(() => {
    onTestFinished(() => killAll(pids()));
  });
};

describe("worker under kosmo serve", { timeout: 60_000 }, () => {
  let supervisor: NodeProcess;
  let worker: number;
  let config: string;

  beforeAll(async () => {
    config = await readFile(configFile, "utf8");
    ({ supervisor, worker } = await startSupervisor("serve"));
  }, 120_000);

  afterAll(async () => {
    await writeFile(configFile, config, "utf8");
  });

  // waits for a worker other than the current one, which must be gone by then
  const expectRestarted = async (match?: (served: Served) => boolean) => {
    const previous = worker;
    const response = await waitForServed("serve", (served) => {
      return served.pid !== previous && (match?.(served) ?? true);
    });
    expect(response.ppid).toEqual(supervisor.pid);
    expect(await isAlive(previous)).toBe(false);
    worker = response.pid;
    return response;
  };

  test("runs the worker in a child process", async () => {
    expect(worker).not.toEqual(supervisor.pid);
    expect(await isAlive(worker)).toBe(true);
  });

  test("a change to the folder config restarts the worker", async () => {
    const mark = supervisor.output().length;
    await touch(configFile);
    await expectRestarted();
    expect(outputSince(supervisor, mark)).toMatch(
      "src/test/kosmo.config.ts changed, restarting",
    );
  });

  test("a change to package.json restarts the worker", async () => {
    const mark = supervisor.output().length;
    await touch(resolve(root, "package.json"));
    await expectRestarted();
    expect(outputSince(supervisor, mark)).toMatch(
      "package.json changed, restarting",
    );
  });

  // created rather than changed: neither file exists until now
  for (const [label, file, value] of [
    ["a root env file", ".env", "root"],
    ["a folder env file", "src/test/.env", "folder"],
  ] as const) {
    test(`${label} restarts the worker, which reads it anew`, async () => {
      const mark = supervisor.output().length;
      await writeFile(resolve(root, file), `PROBE_ENV=${value}\n`, "utf8");
      const response = await expectRestarted(({ env }) => env === value);
      expect(response.env).toEqual(value);
      expect(outputSince(supervisor, mark)).toMatch(
        `${file} changed, restarting`,
      );
    });
  }

  test("a change to a source file does not restart the worker", async () => {
    const mark = supervisor.output().length;
    await touch(createPath.api(`${ROUTE}/index.ts`));
    await sleep(1_500);
    expect((await served("serve"))?.pid).toEqual(worker);
    expect(outputSince(supervisor, mark)).not.toMatch("restarting");
  });

  test("changes landing together restart the worker once", async () => {
    const mark = supervisor.output().length;
    await Promise.all([
      touch(configFile),
      touch(resolve(root, "package.json")),
    ]);
    await expectRestarted();
    // the next round of a burst would come within the debounce
    await sleep(1_500);
    expect((await served("serve"))?.pid).toEqual(worker);
    const restarts = outputSince(supervisor, mark).match(/restarting/g) || [];
    expect(restarts).toHaveLength(1);
  });

  test("a worker that dies waits for a change to come back", async () => {
    const mark = supervisor.output().length;

    process.kill(worker, "SIGKILL");

    await waitFor(
      () => outputSince(supervisor, mark).includes("worker exited (SIGKILL)"),
      { message: "the dead worker to be reported" },
    );

    // not respawned on its own
    await sleep(1_500);
    expect(await portFree("serve")).toBe(true);
    expect(await isAlive(supervisor.pid)).toBe(true);

    await touch(configFile);
    await expectRestarted();
  });

  test("a config that fails to load stops the worker until a fixing save", async () => {
    const mark = supervisor.output().length;

    await writeFile(configFile, "export default {\n", "utf8");

    await waitFor(
      () => outputSince(supervisor, mark).includes("worker exited (1)"),
      { message: "the failed worker to be reported" },
    );

    expect(await isAlive(worker)).toBe(false);
    expect(await isAlive(supervisor.pid)).toBe(true);

    await writeFile(configFile, config, "utf8");
    await expectRestarted();
  });

  test("SIGTERM stops the supervisor and its worker", async () => {
    supervisor.proc.kill("SIGTERM");
    expect(await supervisor.waitForExit()).toEqual({ code: 0, signal: null });
    await expectGone("serve", [worker]);
  });
});

describe("stopping kosmo serve", { timeout: 60_000 }, () => {
  let pids: Array<number> = [];
  killLeftovers(() => pids);

  const stops: Array<
    [name: string, stop: (supervisor: NodeProcess) => void, exit: Exit]
  > = [
    [
      "SIGINT to the supervisor",
      (supervisor) => supervisor.proc.kill("SIGINT"),
      { code: 0, signal: null },
    ],
    // as Ctrl-C in a terminal: the worker gets the signal too, at the same time
    [
      "SIGINT to the whole process group",
      (supervisor) => process.kill(-supervisor.pid, "SIGINT"),
      { code: 0, signal: null },
    ],
    // no handler runs: the worker learns it from its IPC channel closing
    [
      "SIGKILL to the supervisor",
      (supervisor) => supervisor.proc.kill("SIGKILL"),
      { code: null, signal: "SIGKILL" },
    ],
  ];

  for (const [name, stop, exit] of stops) {
    test(`${name} leaves no worker behind`, async () => {
      const { supervisor, worker } = await startSupervisor("serve", {
        group: true,
      });
      pids = [supervisor.pid, worker];

      stop(supervisor);

      expect(await supervisor.waitForExit()).toEqual(exit);
      await expectGone("serve", [worker]);
    });
  }
});

describe("worker under kosmo preview", { timeout: 150_000 }, () => {
  let pids: Array<number> = [];
  killLeftovers(() => pids);

  test("a config change restarts the worker, and the runner with it", async () => {
    const { supervisor, worker, served } = await startSupervisor("preview");
    pids = [supervisor.pid, worker, served.pid];

    await touch(configFile);

    const next = await waitForServed("preview", ({ ppid }) => ppid !== worker);
    pids.push(next.ppid, next.pid);

    expect(await isAlive(worker)).toBe(false);
    expect(await isAlive(served.pid)).toBe(false);

    supervisor.proc.kill("SIGTERM");
    expect(await supervisor.waitForExit()).toEqual({ code: 0, signal: null });
    await expectGone("preview", [next.ppid, next.pid]);
  });

  test("SIGKILL to the supervisor leaves neither worker nor runner behind", async () => {
    const { supervisor, worker, served } = await startSupervisor("preview");
    pids = [supervisor.pid, worker, served.pid];

    supervisor.proc.kill("SIGKILL");

    expect(await supervisor.waitForExit()).toEqual({
      code: null,
      signal: "SIGKILL",
    });
    await expectGone("preview", [worker, served.pid]);
  });
});
