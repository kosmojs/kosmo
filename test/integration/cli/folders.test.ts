import { mkdir, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createBin, createTempDir, kosmoBin, run } from ".";

const tempDir = await createTempDir();

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("folder: flag matrix", async () => {
  const createFolder = async (args: Array<string>) => {
    await mkdir(tempDir, { recursive: true });

    const projectName = "test";
    const projectRoot = resolve(tempDir, projectName);

    // create host project
    await run(
      createBin,
      [projectName, "--no-frontend", "--no-backend"],
      tempDir,
    );

    const result = await run(kosmoBin, ["folder", ...args], projectRoot);

    return {
      entries: await readdir(
        resolve(projectRoot, join(defaults.srcDir, args[0])),
      ).catch(() => []),
      ...result,
    };
  };

  test("frontend + backend", async () => {
    const { code, entries } = await createFolder([
      "test",
      "--frontend",
      "solid",
      "--backend",
      "h3",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("api");
    expect(entries).toContain("pages");
  });

  test("--no-frontend creates a backend-only folder", async () => {
    const { code, entries } = await createFolder([
      "test",
      "--backend",
      "hono",
      "--no-frontend",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("api");
    expect(entries).not.toContain("pages");
  });

  test("--no-backend creates a frontend-only folder", async () => {
    const { code, entries } = await createFolder([
      "test",
      "--frontend",
      "svelte",
      "--no-backend",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("pages");
    expect(entries).not.toContain("api");
  });

  test("both negations create a bare folder", async () => {
    const { code, entries } = await createFolder([
      "test",
      "--no-frontend",
      "--no-backend",
    ]);
    expect(code).toEqual(0);
    expect(entries).not.toContain("api");
    expect(entries).not.toContain("pages");
  });

  test("missing name fails", async () => {
    const { code, stderr } = await createFolder([
      "--frontend",
      "solid",
      "--backend",
      "h3",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/No folder name provided/);
  });

  test("missing frontend fails", async () => {
    const { code, stderr } = await createFolder(["test", "--backend", "h3"]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/frontend is required/);
  });

  test("missing backend fails", async () => {
    const { code, stderr } = await createFolder([
      "test",
      "--frontend",
      "solid",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/backend is required/);
  });

  test("invalid frontend value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      "test",
      "--frontend",
      "x",
      "--no-backend",
      "h3",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid frontend/i);
    expect(stderr).toMatch(/react/);
  });

  test("invalid backend value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      "test",
      "--no-frontend",
      "--backend",
      "x",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid backend/i);
    expect(stderr).toMatch(/hono/);
  });

  test("frontend value + negation is a conflict", async () => {
    const { code, stderr } = await createFolder([
      "test",
      "--frontend",
      "solid",
      "--no-frontend",
      "--backend",
      "h3",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/mutually exclusive/i);
  });

  test("backend value + negation is a conflict", async () => {
    const { code, stderr } = await createFolder([
      "test",
      "--frontend",
      "solid",
      "--no-frontend",
      "--backend",
      "h3",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/mutually exclusive/i);
  });

  test("unknown option fails with a clean error, not a stack trace", async ({
    expect,
  }) => {
    const { code, stderr } = await createFolder([
      "test",
      "--frontend",
      "solid",
      "--backend",
      "h3",
      "--unknown-option",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch("Unknown option '--unknown-option'");
    expect(stderr).not.toMatch(/ERR_PARSE_ARGS_UNKNOWN_OPTION/);
  });

  test("existing dir fails", async () => {
    const { code } = await createFolder([
      "test",
      "--no-frontend",
      "--no-backend",
    ]);

    expect(code).toEqual(0);

    {
      const { code, stderr } = await createFolder([
        "test",
        "--no-frontend",
        "--no-backend",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/already exists/);
    }
  });

  test("existing dir succeeds with --overwrite", async () => {
    const { code } = await createFolder([
      "test",
      "--no-frontend",
      "--no-backend",
    ]);

    expect(code).toEqual(0);

    {
      const { code } = await createFolder([
        "test",
        "--no-frontend",
        "--no-backend",
        "--overwrite",
      ]);
      expect(code).toEqual(0);
    }
  });
});
