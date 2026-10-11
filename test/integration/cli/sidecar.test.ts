import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createBin, createTempDir, kosmoBin, run } from ".";

describe("sidecar folder: flag matrix", async ({ afterEach }) => {
  const tempDir = await createTempDir();

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const projectName = "test";
  const folderName = "test";
  const folderNameArgs = ["--name", folderName];

  const createSidecar = async (args: Array<string>) => {
    await mkdir(tempDir, { recursive: true });

    const projectRoot = resolve(tempDir, projectName);

    // create host project
    await run(
      createBin,
      ["--name", projectName, "--no-frontend", "--no-backend"],
      tempDir,
    );

    const result = await run(kosmoBin, ["sidecar", ...args], projectRoot);

    const folderPath = resolve(projectRoot, join(defaults.srcDir, folderName));

    return {
      entries: await readdir(folderPath).catch(() => []),
      config: await readFile(resolve(folderPath, "kosmo.config.ts"), "utf8") //
        .catch(() => ""),
      ...result,
    };
  };

  test("seeds the entry, the runner and a folder tsconfig", async () => {
    const { code, entries } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);
    expect(entries.sort()).toEqual([
      "entry.ts",
      "kosmo.config.ts",
      "run.ts",
      "tsconfig.json",
    ]);
  });

  test("seeds no route folders - a sidecar serves nothing", async () => {
    const { code, entries } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);
    expect(entries).not.toContain("api");
    expect(entries).not.toContain("pages");
  });

  test("writes a sidecar block pointing at both seeded files", async () => {
    const { code, config } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);
    expect(config).toMatch(/sidecar:\s*\{/);
    expect(config).toMatch(/entry:\s*"\.\/entry\.ts"/);
    expect(config).toMatch(/run:\s*"\.\/run\.ts"/);
    // off by default: starting it under the dev server is opt-in
    expect(config).toMatch(/serve:\s*false/);
  });

  test("declares neither frontend nor backend", async () => {
    const { code, config } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);
    expect(config).not.toMatch(/frontend:/);
    expect(config).not.toMatch(/backend:/);
  });

  test("missing name fails", async () => {
    const { code, stderr } = await createSidecar([]);

    expect(code).not.toEqual(0);
    expect(stderr).toMatch(/No.+name provided/);
  });

  test("existing dir fails", async () => {
    const { code } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);

    {
      const { code, stderr } = await createSidecar([...folderNameArgs]);
      expect(code).not.toEqual(0);
      expect(stderr).toMatch(/already exists/);
    }
  });

  test("existing dir succeeds with --overwrite", async () => {
    const { code } = await createSidecar([...folderNameArgs]);

    expect(code).toEqual(0);

    {
      const { code } = await createSidecar([...folderNameArgs, "--overwrite"]);
      expect(code).toEqual(0);
    }
  });

  test("unknown option fails with a clean error, not a stack trace", async () => {
    const { code, stderr } = await createSidecar([
      ...folderNameArgs,
      "--unknown-option",
    ]);

    expect(code).not.toEqual(0);
    expect(stderr).toMatch("Unknown option '--unknown-option'");
    expect(stderr).not.toMatch(/ERR_PARSE_ARGS_UNKNOWN_OPTION/);
  });
});
