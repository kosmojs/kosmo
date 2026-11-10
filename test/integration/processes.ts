import { type ChildProcess, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { connect } from "node:net";

import { env } from ".";

/**
 * Helpers for suites that run kosmo in processes of its own and check what each one leaves behind.
 * A leak there is a process outliving the one that started it,
 * so most claims are about pids: which are alive, and who is serving a port.
 * */

/**
 * True while `pid` runs, or holds anything it opened.
 *
 * A zombie has already exited, only its parent has not collected it yet.
 * It answers signal 0 all the same, so on Linux /proc tells the two apart.
 * The main thread turns zombie first, though, while the other threads are still exiting
 * and the process still holds its sockets; it is gone once it is down to that one thread.
 * */
export const isAlive = async (pid: number) => {
  try {
    process.kill(pid, 0);
  } catch {
    return false;
  }
  const status = await readFile(`/proc/${pid}/status`, "utf8").catch(() => "");
  const zombie = /^State:\s+Z/m.test(status);
  const threads = Number(status.match(/^Threads:\s+(\d+)/m)?.[1] ?? 0);
  return !(zombie && threads <= 1);
};

/**
 * Polls `check` until it returns a value other than undefined or false,
 * failing with `message` once `timeout` runs out.
 * */
export const waitFor = async <T>(
  check: () => Promise<T | undefined | false> | T | undefined | false,
  { timeout = 30_000, message = "condition" } = {},
): Promise<T> => {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value !== undefined && value !== false) {
      return value;
    }
    if (Date.now() > deadline) {
      throw new Error(`timed out after ${timeout}ms waiting for ${message}`);
    }
    await sleep(100);
  }
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// true once nothing accepts connections at `host:port`
export const isPortFree = (host: string, port: number) => {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(true));
  });
};

/**
 * GETs `url` as JSON; undefined when nothing answers or the answer is not a 200.
 * Not cached, not kept alive: every call opens a connection of its own,
 * so a call never reaches a server that has already stopped accepting.
 * */
export const getJSON = async <T = Record<string, unknown>>(url: string) => {
  try {
    const response = await fetch(url, {
      headers: { connection: "close" },
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? ((await response.json()) as T) : undefined;
  } catch {
    return undefined;
  }
};

export type Exit = { code: number | null; signal: NodeJS.Signals | null };

export type NodeProcess = {
  proc: ChildProcess;
  pid: number;
  // everything the process wrote to stdout and stderr so far
  output: () => string;
  // resolves once the process is gone, however it went; rejects if it is still running after `ms`
  waitForExit: (ms?: number) => Promise<Exit>;
};

const spawned = new Set<ChildProcess>();

/**
 * Runs `node ...args` in `cwd`, with an IPC channel, the way kosmo spawns its own processes:
 * the channel closing is how each of them learns its parent is gone.
 * Output is captured, not printed - set DEBUG to see it as it comes.
 *
 * `group` puts the process in a process group of its own, as a terminal does;
 * `process.kill(-pid, signal)` then signals it and every process it started, as Ctrl-C does.
 * */
export const spawnNode = (
  args: Array<string>,
  cwd: string,
  opts?: { group?: boolean },
): NodeProcess => {
  const proc = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    detached: opts?.group === true,
  });

  spawned.add(proc);

  let output = "";

  for (const stream of [proc.stdout, proc.stderr]) {
    stream?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (env.DEBUG) {
        process.stderr.write(chunk);
      }
    });
  }

  const exited = new Promise<Exit>((resolve) => {
    proc.once("exit", (code, signal) => {
      spawned.delete(proc);
      resolve({ code, signal });
    });
  });

  const waitForExit = async (ms = 10_000) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        exited,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(
              new Error(`process ${proc.pid} still running after ${ms}ms`),
            );
          }, ms);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  if (!proc.pid) {
    throw new Error(`failed to spawn node ${args.join(" ")}`);
  }

  return { proc, pid: proc.pid, output: () => output, waitForExit };
};

/**
 * Kills every process `spawnNode` started that is still running, along with `pids`.
 * For afterAll, so a failed claim does not leave its processes behind for the next suite.
 * */
export const killAll = async (pids: Iterable<number> = []) => {
  const targets = [...[...spawned].flatMap(({ pid }) => pid ?? []), ...pids];
  for (const pid of targets) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // gone already
    }
  }
};
