import { mkdir, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { describe, expect, it, test } from "vitest";

import { defaults, FRONTENDS } from "@kosmojs/core";

import { createBin, createTempDir, kosmoBin, run } from ".";

describe("http folder: flag matrix", async ({ afterEach }) => {
  const tempDir = await createTempDir();

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const projectName = "test";
  const folderName = "test";
  const folderNameArgs = ["--name", folderName];

  const createFolder = async (args: Array<string>) => {
    await mkdir(tempDir, { recursive: true });

    const projectRoot = resolve(tempDir, projectName);

    // create host project
    await run(
      createBin,
      ["--name", projectName, "--frontend", Object.keys(FRONTENDS)[0]],
      tempDir,
    );

    const result = await run(kosmoBin, ["folder", ...args], projectRoot);

    return {
      entries: await readdir(
        resolve(projectRoot, join(defaults.srcDir, folderName)),
      ).catch(() => []),
      ...result,
    };
  };

  test("no --frontend no --sidecar creates a backend-only folder", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--backend",
      "hono",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain(defaults.apiDir);
    expect(entries).not.toContain(defaults.pagesDir);
    expect(entries).not.toContain(defaults.sidecarDir);
  });

  test("no --backend no --sidecar creates a frontend-only folder", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--frontend",
      "svelte",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain(defaults.pagesDir);
    expect(entries).not.toContain(defaults.apiDir);
    expect(entries).not.toContain(defaults.sidecarDir);
  });

  it("creates a frontend with a sidecar", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--frontend",
      "svelte",
      "--sidecar",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain(defaults.pagesDir);
    expect(entries).not.toContain(defaults.apiDir);
    expect(entries).toContain(defaults.sidecarDir);
  });

  it("creates a backend with a sidecar", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--backend",
      "h3",
      "--sidecar",
    ]);
    expect(code).toEqual(0);
    expect(entries).not.toContain(defaults.pagesDir);
    expect(entries).toContain(defaults.apiDir);
    expect(entries).toContain(defaults.sidecarDir);
  });

  it("creates a frontend + backend", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--frontend",
      "vue",
      "--backend",
      "h3",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain(defaults.pagesDir);
    expect(entries).toContain(defaults.apiDir);
    expect(entries).not.toContain(defaults.sidecarDir);
  });

  it("creates a frontend + backend + sidecar", async () => {
    const { code, entries } = await createFolder([
      ...folderNameArgs,
      "--frontend",
      "vue",
      "--backend",
      "h3",
      "--sidecar",
    ]);
    expect(code).toEqual(0);
    expect(entries).toContain(defaults.pagesDir);
    expect(entries).toContain(defaults.apiDir);
    expect(entries).toContain(defaults.sidecarDir);
  });

  it("fails when none of frontend/backend/sidecar provided", async () => {
    const { code, stderr } = await createFolder([...folderNameArgs]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/at least one/i);
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

  test("invalid frontend value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      ...folderNameArgs,
      "--frontend",
      "x",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid frontend/i);
    expect(stderr).toMatch(/react/);
  });

  test("invalid backend value fails, listing options", async () => {
    const { code, stderr } = await createFolder([
      ...folderNameArgs,
      "--backend",
      "x",
    ]);
    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/invalid backend/i);
    expect(stderr).toMatch(/hono/);
  });

  test("unknown option fails with a clean error, not a stack trace", async ({
    expect,
  }) => {
    const { code, stderr } = await createFolder([
      ...folderNameArgs,
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
    const { code } = await createFolder([...folderNameArgs, "--sidecar"]);

    expect(code).toEqual(0);

    {
      const { code, stderr } = await createFolder([
        ...folderNameArgs,
        "--sidecar",
      ]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/already exists/);
    }
  });

  test("existing dir succeeds with --overwrite", async () => {
    const { code } = await createFolder([...folderNameArgs, "--sidecar"]);

    expect(code).toEqual(0);

    {
      const { code } = await createFolder([
        ...folderNameArgs,
        "--sidecar",
        "--overwrite",
      ]);
      expect(code).toEqual(0);
    }
  });
});
