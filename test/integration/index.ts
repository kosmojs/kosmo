import child_process from "node:child_process";
import net from "node:net";
import { tmpdir } from "node:os";
import { posix, resolve } from "node:path";
import { promisify } from "node:util";

import { compile } from "path-to-regexp";

import { createPathPattern, pathTokensFactory } from "@kosmojs/lib";

export const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");
export const pkgsDir = resolve(import.meta.dirname, "../../packages");

export const execFile = promisify(child_process.execFile);

// pnpm exports its resolved config to child processes; an inherited
// workspace-dir var pins the install to the monorepo root regardless of cwd
export const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^p?npm_config_/i.test(key)),
);

// fixture deps' build scripts are irrelevant for integration tests;
// keep ERR_PNPM_IGNORED_BUILDS from failing the install
env.PNPM_CONFIG_STRICT_DEP_BUILDS = "false";

// Ports are allocated long before servers actually bind(dependency install and build run in between),
// so the range must sit below the kernel's ephemeral source-port range (32768-60999 on Linux);
// otherwise outbound connections made by pnpm/got/playwright during that window
// can take a port that was already checked as free.
const PORT_RANGE = [20_000, 29_999];

// Width of the sub-range reserved for each vitest worker process.
const PORTS_PER_WORKER = 500;

// Parallel workers each run their own copy of this module;
// scanning a worker-specific sub-range prevents two workers from picking the same port
// between the check and the actual bind.
const workerOffset =
  (Number(process.env.VITEST_POOL_ID ?? 0) * PORTS_PER_WORKER) %
  (PORT_RANGE[1] - PORT_RANGE[0] + 1);

// Cursor advancing through the worker's sub-range so the same port is
// never handed out twice within a worker, even before servers bind.
let portCursor = 0;

export const exec = async (
  cmd: string,
  args?: Array<string>,
  opts?: Record<string, unknown>,
) => {
  try {
    if (env.DEBUG) {
      const { env, ...opt } = { ...opts };
      console.log(cmd, args, opt);
    }
    const output = await execFile(cmd, args, opts);
    if (env.DEBUG) {
      if (output?.stdout) {
        console.log(output.stdout);
      }
      if (output?.stderr) {
        console.error(output.stderr);
      }
    }
    return output;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

type PathSource =
  | string
  | [route: string, params?: Record<string, unknown> | undefined];

export const compileRoutePath = (
  route: string,
  params?: Record<string, unknown> | undefined,
) => {
  const pathTokens = pathTokensFactory(route);
  const pathPattern = createPathPattern(pathTokens);
  const toPath = compile(pathPattern);
  return toPath({ ...params } as never);
};

export const createRoutePath = (base: string, pathSource: PathSource) => {
  if (Array.isArray(pathSource)) {
    const [route, params] = pathSource;
    return posix.join("/", base, compileRoutePath(route, params));
  }
  return pathSource.startsWith("/") //
    ? pathSource
    : posix.join(base, pathSource);
};

export const contentPatternFor = (route: string) => {
  return new RegExp(`data-page-route="${route.replace(/[[\]{}]/g, "\\$&")}"`);
};

export const installDependencies = async (
  cwd: string,
  args?: Array<string>,
) => {
  await exec(
    "pnpm",
    [
      "install",
      "--store-dir",
      pnpmDir,
      "--no-frozen-lockfile",
      "--prefer-offline",
      ...(args || []),
    ],
    { cwd, env },
  );
};

export const buildProject = (cwd: string) => {
  return exec("pnpm", ["build"], { cwd, env });
};

export const findFreePort = async (): Promise<number> => {
  const [minPort] = PORT_RANGE;

  for (let i = 0; i < PORTS_PER_WORKER; i++) {
    const port = minPort + workerOffset + ((portCursor + i) % PORTS_PER_WORKER);

    if (await isPortFree(port)) {
      portCursor = (portCursor + i + 1) % PORTS_PER_WORKER;
      return port;
    }
  }

  throw new Error(
    `No free ports found in worker range ${minPort + workerOffset}-${
      minPort + workerOffset + PORTS_PER_WORKER - 1
    }`,
  );
};

const isPortFree = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    // Bind the unspecified host, same as the servers under test do;
    // checking 127.0.0.1 alone misses ports taken only on "::".
    server.listen(port);
  });
};
