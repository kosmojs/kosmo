import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { env, execFile } from "..";

export const pkgsDir = resolve(import.meta.dirname, "../../../packages");
export const createBin = resolve(pkgsDir, "create/pkg/cli.js");
export const kosmoBin = resolve(pkgsDir, "cli/pkg/cli.js");

export const createTempDir = () => mkdtemp(resolve(tmpdir(), ".kosmojs-"));

/**
 * The shared exec helper exits the whole process on failure;
 * error-path tests need the failure itself, so exec raw and capture.
 * */
export const run = async (bin: string, args: Array<string>, cwd: string) => {
  try {
    const { stdout, stderr } = await execFile(
      process.execPath,
      [bin, ...args],
      { cwd, env },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    const { code, stdout, stderr } = error as {
      code?: unknown;
      stdout?: unknown;
      stderr?: unknown;
    };
    if (code === "ENOENT") {
      // spawn-level failure: the bin never ran. Fires for a missing cwd
      // as well as a missing executable - never treat it as a CLI error
      throw new Error(`spawn failed (ENOENT); bin: ${bin}, cwd: ${cwd}`);
    }
    return {
      code: typeof code === "number" ? code : 1,
      stdout: String(stdout || ""),
      stderr: String(stderr || ""),
    };
  }
};
