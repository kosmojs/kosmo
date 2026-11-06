import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { load } from "cheerio";
import { glob } from "tinyglobby";

import { pathResolver } from "@kosmojs/lib";

import type { setupTestProject } from "../setup";

export type Project = Awaited<ReturnType<typeof setupTestProject>>;

export const ROUTE = "env";

// only in the unprefixed ENV_SECRET; must never appear in a built file
export const SECRET = "s3cr3t-value-7f2a";

/**
 * Set in process.env before the env files are read, and defined in .env as well:
 * the real environment wins over any file.
 * */
export const REAL_ENV = { VITE_ENV_REAL: "from-process" };

/**
 * Env files the test projects get, for the "test" mode they build in.
 * Root files load first, then the folder's,
 * each as .env, .env.local, .env.[mode], .env.[mode].local,
 * later files winning.
 * */
const envFiles = (folder: string): Record<string, string> => ({
  ".env": [
    "VITE_ENV_ROOT=root",
    "VITE_ENV_OVERRIDE=root",
    "VITE_ENV_REAL=from-file",
    `ENV_SECRET=${SECRET}`,
    "ENV_BASE=https://example.test",
  ].join("\n"),
  ".env.test": ["VITE_ENV_MODE=test-mode", "VITE_ENV_OVERRIDE=root-test"].join(
    "\n",
  ),
  // another mode, never loaded
  ".env.production": "VITE_ENV_PROD=prod",
  // a folder file wins over every root file, the mode file included
  [`src/${folder}/.env`]: [
    "VITE_ENV_OVERRIDE=folder",
    // expanded against an unprefixed key, which itself stays out of the frontend
    // biome-ignore lint/suspicious/noTemplateCurlyInString: dotenv expansion syntax
    "VITE_ENV_EXPANDED=${ENV_BASE}/api",
  ].join("\n"),
  [`src/${folder}/.env.local`]: "VITE_ENV_LOCAL=local",
});

export const KEYS = [
  "VITE_ENV_ROOT",
  "VITE_ENV_OVERRIDE",
  "VITE_ENV_MODE",
  "VITE_ENV_EXPANDED",
  "VITE_ENV_LOCAL",
  "VITE_ENV_PROD",
  "VITE_ENV_REAL",
  "ENV_SECRET",
  "ENV_BASE",
] as const;

type Expected = Record<(typeof KEYS)[number], string | null>;

// what import.meta.env holds: VITE_ keys only, null where unset
export const expectedFrontend: Expected = {
  VITE_ENV_ROOT: "root",
  VITE_ENV_OVERRIDE: "folder",
  VITE_ENV_MODE: "test-mode",
  VITE_ENV_EXPANDED: "https://example.test/api",
  VITE_ENV_LOCAL: "local",
  VITE_ENV_PROD: null,
  VITE_ENV_REAL: "from-process",
  ENV_SECRET: null,
  ENV_BASE: null,
};

// what process.env holds for the backend: every key, null where unset
export const expectedBackend: Expected = {
  ...expectedFrontend,
  ENV_SECRET: SECRET,
  ENV_BASE: "https://example.test",
};

/**
 * Sets REAL_ENV in process.env; the returned writeFiles writes the env files,
 * for the bootstrap callback, once the project dir exists.
 * restore also drops every key the backend env provider wrote,
 * since it writes into the process running the build.
 * */
export const setupEnv = ({ project, sourceFolder }: Project) => {
  const before = { ...process.env };

  Object.assign(process.env, REAL_ENV);

  const writeFiles = async () => {
    for (const [file, content] of Object.entries(envFiles(sourceFolder.name))) {
      await writeFile(resolve(project.root, file), `${content}\n`);
    }
  };

  const restore = () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in before)) {
        delete process.env[key];
      }
    }
  };

  // drops what the in-process build wrote, keeping REAL_ENV
  const dropBuildEnv = () => {
    restore();
    Object.assign(process.env, REAL_ENV);
  };

  return { writeFiles, restore, dropBuildEnv };
};

// each key read statically, as `define` only replaces the full `import.meta.env.KEY` expression
const frontendReads = KEYS.map((key) => {
  return `${key}: import.meta.env.${key} ?? null,`;
}).join("\n");

const backendReads = KEYS.map((key) => {
  return `${key}: process.env.${key} ?? null,`;
}).join("\n");

// react page rendering the env it sees as JSON in #env
export const pageSource = () => `
  const env = {
    ${frontendReads}
  };
  export default function Page() {
    return <pre id="env">{JSON.stringify(env)}</pre>;
  }
`;

// hono route responding with the env it sees
export const routeSource = () => `
  import { defineRoute } from "_/api";
  export default defineRoute<"${ROUTE}">(({ GET }) => [
    GET((ctx) => {
      return ctx.json({
        ${backendReads}
      });
    }),
  ]);
`;

const pickReads = (
  read: "frontend" | "backend",
  keys: ReadonlyArray<string>,
) => {
  return keys
    .map((key) => {
      const source = read === "frontend" ? "import.meta.env" : "process.env";
      return `${key}: ${source}.${key} ?? null,`;
    })
    .join("\n");
};

const pick = (expected: Expected, keys: ReadonlyArray<string>) => {
  return Object.fromEntries(keys.map((key) => [key, expected[key as never]]));
};

export const PREFIXED_TEST = "prefixed keys";
export const UNPREFIXED_TEST = "unprefixed keys";

/**
 * Test file for the project's own vitest, reading env as the given scope does,
 * split into prefixed and unprefixed keys so each claim reports on its own.
 * */
export const testSource = (
  read: "frontend" | "backend",
  expected: Expected,
) => {
  const prefixed = KEYS.filter((key) => key.startsWith("VITE_"));
  const unprefixed = KEYS.filter((key) => !key.startsWith("VITE_"));
  return `
    import { expect, test } from "vitest";
    test(${JSON.stringify(PREFIXED_TEST)}, () => {
      expect({
        ${pickReads(read, prefixed)}
      }).toEqual(${JSON.stringify(pick(expected, prefixed))});
    });
    test(${JSON.stringify(UNPREFIXED_TEST)}, () => {
      expect({
        ${pickReads(read, unprefixed)}
      }).toEqual(${JSON.stringify(pick(expected, unprefixed))});
    });
  `;
};

export const readPageEnv = (content: string) => {
  const text = load(content)("#env").text();
  return text ? JSON.parse(text) : undefined;
};

// built files under the project's dist root (every folder, plus run.js) that contain the secret
export const filesWithSecret = async ({ project, sourceFolder }: Project) => {
  const { createPath } = pathResolver(project, sourceFolder);
  const dist = resolve(createPath.distDir(), "..");
  const files = await glob("**/*", {
    cwd: dist,
    absolute: true,
    onlyFiles: true,
  });
  const hits: Array<string> = [];
  for (const file of files) {
    const content = await readFile(file, "utf8").catch(() => "");
    if (content.includes(SECRET)) {
      hits.push(file.replace(join(dist, "/"), ""));
    }
  }
  return { files: files.length, hits };
};
