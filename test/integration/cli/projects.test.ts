import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import crc from "crc/crc32";
import { afterEach, describe, expect, test } from "vitest";

import { DEFAULT_NAME } from "@kosmojs/cli";
import { defaults } from "@kosmojs/core";

import { createBin, createTempDir, run } from ".";

const tempDir = await createTempDir();

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

for (const projectName of [
  // scaffold in ./test
  "test",
  // scaffold in ./
  ".",
]) {
  describe(`create project: ${projectName}`, () => {
    const createProject = async (
      args: Array<string>,
      cwd: string = resolve(
        tempDir,
        String(crc(JSON.stringify([projectName, ...args].sort()))),
      ),
    ) => {
      // the cwd itself, not just its parent: spawning into a missing cwd
      // fails with a misleading "spawn node ENOENT"
      await mkdir(cwd, { recursive: true });

      const result = await run(createBin, args, cwd);

      const folderName =
        args.indexOf("--name") >= 0
          ? args[args.indexOf("--name") + 1]
          : DEFAULT_NAME;

      const folderPath = resolve(
        cwd,
        join(projectName, defaults.srcDir, folderName),
      );

      return {
        cwd,
        folderName,
        folderPath,
        folderEntries: await readdir(folderPath).catch(() => []),
        folderConfig: await readFile(
          resolve(folderPath, "kosmo.config.ts"),
          "utf8",
        ).catch(() => ""),
        ...result,
      };
    };

    test("framework + backend", async () => {
      const { code, stderr, folderEntries } = await createProject([
        projectName,
        "--framework",
        "react",
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code, stderr).toEqual(0);
      expect(folderEntries).toContain("kosmo.config.ts");
      expect(folderEntries).toContain("api");
      expect(folderEntries).toContain("pages");
    });

    test("--no-framework creates a backend-only folder", async () => {
      const { code, folderEntries } = await createProject([
        projectName,
        "--no-framework",
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code).toEqual(0);
      expect(folderEntries).toContain("kosmo.config.ts");
      expect(folderEntries).toContain("api");
      expect(folderEntries).not.toContain("pages");
    });

    test("--no-backend creates a frontend-only folder", async () => {
      const { code, folderEntries } = await createProject([
        projectName,
        "--framework",
        "mdx",
        "--no-backend",
        "-q",
      ]);
      expect(code).toEqual(0);
      expect(folderEntries).toContain("kosmo.config.ts");
      expect(folderEntries).toContain("pages");
      expect(folderEntries).not.toContain("api");
    });

    test("both negations create a bare folder", async () => {
      const { code, folderEntries } = await createProject([
        projectName,
        "--no-framework",
        "--no-backend",
        "-q",
      ]);
      expect(code).toEqual(0);
      expect(folderEntries).toContain("kosmo.config.ts");
      expect(folderEntries).not.toContain("api");
      expect(folderEntries).not.toContain("pages");
    });

    test("--name/--base override the folder defaults", async () => {
      const { code, folderName, folderConfig } = await createProject([
        projectName,
        "--name",
        "web",
        "--base",
        "/web",
        "--framework",
        "vue",
        "--backend",
        "koa",
        "-q",
      ]);
      expect(code).toEqual(0);
      expect(folderName).toEqual("web");
      expect(folderConfig).toContain('base: "/web"');
    });

    test("missing framework fails", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/framework is required/);
    });

    test("missing backend fails", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--framework",
        "react",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/backend is required/);
    });

    test("missing project name fails", async () => {
      const { code, stderr } = await createProject([
        "--framework",
        "react",
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/No project name provided/);
    });

    test("invalid framework value fails, listing options", async ({
      expect,
    }) => {
      const { code, stderr } = await createProject([
        projectName,
        "--framework",
        "angular",
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/invalid framework/i);
      expect(stderr).toMatch(/react/);
    });

    test("invalid backend value fails, listing options", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--framework",
        "solid",
        "--backend",
        "x",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/invalid backend/i);
      expect(stderr).toMatch(/hono/);
    });

    test("framework value + negation is a conflict", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--framework",
        "vue",
        "--no-framework",
        "--backend",
        "h3",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/ERROR/);
    });

    test("backend value + negation is a conflict", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--framework",
        "react",
        "--backend",
        "hono",
        "--no-backend",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/ERROR/);
    });

    test("unknown option fails with a clean error, not a stack trace", async () => {
      const { code, stderr } = await createProject([
        projectName,
        "--unknown-flag",
        "--framework",
        "react",
        "--backend",
        "hono",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch("Unknown option '--unknown-flag'");
      expect(stderr).not.toMatch(/ERR_PARSE_ARGS_UNKNOWN_OPTION/);
    });

    test("existing dir fails", async () => {
      const { code, cwd } = await createProject([
        projectName,
        "--no-framework",
        "--no-backend",
        "-q",
      ]);

      expect(code).toEqual(0);

      {
        const { code, stderr } = await createProject(
          [projectName, "--no-framework", "--no-backend", "-q"],
          cwd,
        );
        expect(code).not.toEqual(0);
        expect(stderr).toMatch(/provide --overwrite flag/);
      }
    });

    test("existing dir succeeds with --overwrite", async () => {
      const { code, cwd } = await createProject([
        projectName,
        "--no-framework",
        "--no-backend",
        "-q",
      ]);

      expect(code).toEqual(0);

      {
        const { code } = await createProject(
          [projectName, "--no-framework", "--no-backend", "--overwrite", "-q"],
          cwd,
        );
        expect(code).toEqual(0);
      }
    });
  });
}
