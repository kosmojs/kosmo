import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { removeDerivedFiles } from "@kosmojs/dev/chassis";

describe("removeDerivedFiles", () => {
  let root: string;

  const touch = async (...path: Array<string>) => {
    await mkdir(join(root, ...path.slice(0, -1)), { recursive: true });
    await writeFile(join(root, ...path), "");
  };

  const exists = async (...path: Array<string>) => {
    const parent = join(root, ...path.slice(0, -1));
    const entries = await readdir(parent).catch(() => []);
    return entries.includes(path[path.length - 1] as never);
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "kosmo-derived-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test("removes the route's files and its now empty directory", async () => {
    await touch("users", "[id]", "types.ts");
    await touch("users", "[id]", "cache.json");
    await touch("users", "index", "types.ts");

    await removeDerivedFiles(join(root, "users", "[id]"), root);

    expect(await exists("users", "[id]")).toBe(false);
    expect(await exists("users", "index", "types.ts")).toBe(true);
  });

  test("keeps the directories of nested routes", async () => {
    await touch("users", "types.ts");
    await touch("users", "schemas.ts");
    await touch("users", "[id]", "types.ts");

    await removeDerivedFiles(join(root, "users"), root);

    expect(await exists("users", "types.ts")).toBe(false);
    expect(await exists("users", "schemas.ts")).toBe(false);
    expect(await exists("users", "[id]", "types.ts")).toBe(true);
  });

  test("prunes empty parents, but never the root", async () => {
    await touch("a", "b", "c", "types.ts");

    await removeDerivedFiles(join(root, "a", "b", "c"), root);

    expect(await exists("a")).toBe(false);
    expect(await readdir(root)).toEqual([]);
  });

  test("stops pruning at the first non-empty parent", async () => {
    await touch("a", "types.ts");
    await touch("a", "b", "types.ts");

    await removeDerivedFiles(join(root, "a", "b"), root);

    expect(await exists("a", "b")).toBe(false);
    expect(await exists("a", "types.ts")).toBe(true);
  });

  test("does nothing for a directory that does not exist", async () => {
    await touch("users", "types.ts");

    await removeDerivedFiles(join(root, "missing"), root);

    expect(await exists("users", "types.ts")).toBe(true);
  });
});
