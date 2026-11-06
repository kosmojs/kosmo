// biome-ignore-all lint/suspicious/noTemplateCurlyInString: env-file syntax under test

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import type { EnvSource, SourceFolder } from "@kosmojs/core";

import { expandEnv } from "../src/dotenv-expand";
import { loadEnvFiles } from "../src/env";

const NAME = "front";

// a project root with src/front, files keyed by path relative to the root
const fixture = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), "kosmo-env-"));
  mkdirSync(join(root, "src", NAME), { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    writeFileSync(join(root, path), content);
  }
  return root;
};

const load = (
  root: string,
  opts?: { mode?: string; config?: SourceFolder["config"] },
) => {
  return loadEnvFiles({
    root,
    name: NAME,
    mode: opts?.mode ?? "development",
    config: opts?.config ?? { frontend: {}, backend: {} },
  } as never);
};

// merged in source order, the way envProvider consumes them
const merged = (sources: Array<EnvSource>, scope: EnvSource["scope"]) => {
  return Object.assign(
    {},
    ...sources.filter((s) => s.scope === scope).map((s) => s.env),
  );
};

const touched = new Set<string>();

afterEach(() => {
  for (const key of touched) {
    delete process.env[key];
  }
  touched.clear();
});

describe("loadEnvFiles", () => {
  test("frontend keeps prefixed keys only, backend keeps every key", async () => {
    const root = fixture({
      ".env": "VITE_PUB=pub\nTOKEN_SECRET=s\nEXTRA=e\nDATABASE_URL=db\n",
    });
    const sources = await load(root);
    expect(merged(sources, "frontend")).toEqual({ VITE_PUB: "pub" });
    expect(merged(sources, "backend")).toEqual({
      VITE_PUB: "pub",
      TOKEN_SECRET: "s",
      EXTRA: "e",
      DATABASE_URL: "db",
    });
  });

  test("later files win: root -> folder, .env -> .env.local -> .env.[mode] -> .env.[mode].local", async () => {
    const root = fixture({
      ".env": "VITE_A=root\nVITE_B=root\nVITE_C=root\n",
      ".env.local": "VITE_A=root-local\n",
      ".env.development": "VITE_B=root-mode\n",
      ".env.production": "VITE_C=other-mode\n",
      [`src/${NAME}/.env.development.local`]: "VITE_C=folder-mode-local\n",
    });
    expect(merged(await load(root), "frontend")).toEqual({
      VITE_A: "root-local",
      VITE_B: "root-mode",
      VITE_C: "folder-mode-local",
    });
  });

  test("references resolve across files, against unprefixed keys too", async () => {
    const root = fixture({
      ".env": "HOST=db.local\n",
      [`src/${NAME}/.env`]: "VITE_URL=http://${HOST}:5432\n",
    });
    expect(merged(await load(root), "frontend")).toEqual({
      VITE_URL: "http://db.local:5432",
    });
  });

  test("the real environment wins and is never written", async () => {
    process.env.KOSMO_T_REAL = "real";
    touched.add("KOSMO_T_REAL");
    const root = fixture({
      ".env":
        "KOSMO_T_REAL=file\nKOSMO_T_URL=${KOSMO_T_REAL}/x\nKOSMO_T_NEW=new\n",
    });
    const backend = merged(await load(root), "backend");
    expect(backend).toEqual({ KOSMO_T_URL: "real/x", KOSMO_T_NEW: "new" });
    expect(process.env.KOSMO_T_REAL).toBe("real");
    expect(process.env.KOSMO_T_NEW).toBeUndefined();
    expect(process.env.KOSMO_T_URL).toBeUndefined();
  });

  test("$(...) is a literal, never a command", async () => {
    const root = fixture({ ".env": "VITE_CMD=$(echo pwned)\n" });
    expect(merged(await load(root), "frontend")).toEqual({
      VITE_CMD: "$(echo pwned)",
    });
  });

  test("custom envPrefix, as a string and as a list", async () => {
    const root = fixture({ ".env": "APP_A=a\nPUB_B=b\nVITE_C=c\nTOKEN=t\n" });
    expect(
      merged(
        await load(root, {
          config: { frontend: { viteConfig: { envPrefix: "APP_" } } },
        } as never),
        "frontend",
      ),
    ).toEqual({ APP_A: "a" });
    expect(
      merged(
        await load(root, {
          config: {
            frontend: { viteConfig: { envPrefix: ["APP_", "PUB_"] } },
          },
        } as never),
        "frontend",
      ),
    ).toEqual({ APP_A: "a", PUB_B: "b" });
  });

  test("envDir replaces the lookup dirs, envDir: false skips the scope", async () => {
    const root = fixture({ ".env": "VITE_ROOT=1\n" });
    mkdirSync(join(root, "env"));
    writeFileSync(join(root, "env", ".env"), "VITE_DIR=1\n");
    const sources = await load(root, {
      config: {
        frontend: { viteConfig: { envDir: "../../env" } },
        backend: { viteConfig: { envDir: false } },
      },
    } as never);
    expect(merged(sources, "frontend")).toEqual({ VITE_DIR: "1" });
    expect(sources.filter((s) => s.scope === "backend")).toEqual([]);
  });
});

describe("expandEnv", () => {
  test("operators and escapes, as dotenv-expand", () => {
    expect(
      expandEnv(
        {
          A: "a",
          B: "${A}-$A",
          C: "${MISSING:-def}",
          D: "${A:+alt}",
          E: "${MISSING:+alt}",
          F: "\\$A",
        },
        {},
      ),
    ).toEqual({
      A: "a",
      B: "a-a",
      C: "def",
      D: "alt",
      E: "",
      F: "$A",
    });
  });

  test("input and processEnv are left untouched", () => {
    const parsed = { A: "${X}" };
    const processEnv = { X: "x" };
    expect(expandEnv(parsed, processEnv)).toEqual({ A: "x" });
    expect(parsed).toEqual({ A: "${X}" });
    expect(processEnv).toEqual({ X: "x" });
  });
});
