import child_process from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

export const rootDir = resolve(import.meta.dirname, "../..");
export const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

const execFile = promisify(child_process.execFile);

export const exec = async (
  cmd: string,
  args?: Array<string>,
  opts?: Record<string, unknown>,
) => {
  try {
    const output = await execFile(cmd, args, opts);
    if (process.env.DEBUG) {
      console.log(output?.stdout);
      console.error(output?.stderr);
    }
    return output;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
