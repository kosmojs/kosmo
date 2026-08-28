import child_process from "node:child_process";
import { promisify } from "node:util";

import { compile } from "path-to-regexp";

import { createPathPattern, pathTokensFactory } from "@kosmojs/lib";

export const execFile = promisify(child_process.execFile);

// pnpm exports its resolved config to child processes; an inherited
// workspace-dir var pins the install to the monorepo root regardless of cwd
export const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^p?npm_config_/i.test(key)),
);

// fixture deps' build scripts are irrelevant for integration tests;
// keep ERR_PNPM_IGNORED_BUILDS from failing the install
env.PNPM_CONFIG_STRICT_DEP_BUILDS = "false";

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

export const createRoutePath = (
  routeName: string,
  params?: Record<string, unknown> | undefined,
) => {
  const pathTokens = pathTokensFactory(routeName);
  const pathPattern = createPathPattern(pathTokens);
  const toPath = compile(pathPattern);
  return toPath({ ...params } as never);
};

export const contentPatternFor = (route: string) => {
  return new RegExp(`data-page-route="${route.replace(/[[\]{}]/g, "\\$&")}"`);
};
