import child_process from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

export const rootDir = resolve(import.meta.dirname, "../..");
export const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

export const execFile = promisify(child_process.execFile);

const { npm_config_minimum_release_age, ...env } = process.env;

export { env };

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
