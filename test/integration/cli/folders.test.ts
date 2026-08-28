import { mkdir, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { DEFAULT_NAME } from "@kosmojs/cli";
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
      [projectName, "--no-framework", "--no-backend", "-q"],
      tempDir,
    );

    const result = await run(kosmoBin, ["folder", ...args], projectRoot);

    const folderName =
      args.indexOf("--name") >= 0
        ? args[args.indexOf("--name") + 1]
        : DEFAULT_NAME;

    return {
      folderName,
      entries: await readdir(
        resolve(projectRoot, join(defaults.srcDir, folderName)),
      ).catch(() => []),
      ...result,
    };
  };

  test("framework + backend", async () => {
    const { code, entries } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "solid",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("api");
    expect(entries).toContain("pages");
  });

  test("--no-framework creates a backend-only folder", async () => {
    const { code, entries } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--backend",
      "hono",
      "--no-framework",
      "-q",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("api");
    expect(entries).not.toContain("pages");
  });

  test("--no-backend creates a frontend-only folder", async () => {
    const { code, entries } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "svelte",
      "--no-backend",
      "-q",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain("pages");
    expect(entries).not.toContain("api");
  });

  test("both negations create a bare folder", async () => {
    const { code, entries } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--no-framework",
      "--no-backend",
      "-q",
    ]);
    expect(code).toEqual(0);
    expect(entries).not.toContain("api");
    expect(entries).not.toContain("pages");
  });

  test("missing name fails", async () => {
    const { code, stderr } = await createFolder([
      "--base",
      "/",
      "--framework",
      "solid",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/No folder name provided/);
  });

  test("missing base fails", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--framework",
      "solid",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/Invalid base/);
  });

  test("missing framework fails", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/framework is required/);
  });

  test("missing backend fails", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "solid",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/backend is required/);
  });

  test("invalid framework value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "x",
      "--no-backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid framework/i);
    expect(stderr).toMatch(/react/);
  });

  test("invalid backend value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--no-framework",
      "--backend",
      "x",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid backend/i);
    expect(stderr).toMatch(/hono/);
  });

  test("framework value + negation is a conflict", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "solid",
      "--no-framework",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/mutually exclusive/i);
  });

  test("backend value + negation is a conflict", async () => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
      "solid",
      "--no-framework",
      "--backend",
      "h3",
      "-q",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/mutually exclusive/i);
  });

  test("unknown option fails with a clean error, not a stack trace", async ({
    expect,
  }) => {
    const { code, stderr } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--framework",
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
      "--name",
      "test",
      "--base",
      "/",
      "--no-framework",
      "--no-backend",
      "-q",
    ]);

    expect(code).toEqual(0);

    {
      const { code, stderr } = await createFolder([
        "--name",
        "test",
        "--base",
        "/",
        "--no-framework",
        "--no-backend",
        "-q",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/already exists/);
    }
  });

  test("existing dir succeeds with --overwrite", async () => {
    const { code } = await createFolder([
      "--name",
      "test",
      "--base",
      "/",
      "--no-framework",
      "--no-backend",
      "-q",
    ]);

    expect(code).toEqual(0);

    {
      const { code } = await createFolder([
        "--name",
        "test",
        "--base",
        "/",
        "--no-framework",
        "--no-backend",
        "--overwrite",
        "-q",
      ]);
      expect(code).toEqual(0);
    }
  });
});
