import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { transformWithOxc } from "vite";

import type { ProjectSettings, SourceFolder } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import runTemplate from "#templates/run";

/**
 * What `dist/run.js` needs to know about a built folder.
 * Written next to the folder's build output so the runner discovers folders from disk
 * rather than from a table that a partial build could leave stale.
 * */
export type FolderManifest = {
  name: string;
  base: string;
  apiBase: string;
  // dist/<folder>/api/listener.js exists
  api: boolean;
  // dist/<folder>/client/ exists
  client: boolean;
  // dist/<folder>/ssr/server.js exists - it bundles the api, run.js mounts it alone
  ssr: boolean;
};

export const folderManifestFactory = (
  sourceFolder: SourceFolder,
): FolderManifest => {
  const { generators } = sourceFolder.config;

  const hasSlot = (slot: string) => {
    return generators.some((e) => e.meta.slot === slot);
  };

  const client = hasSlot("frontend");

  return {
    name: sourceFolder.name,
    base: sourceFolder.config.base,
    apiBase: sourceFolder.config.apiBase,
    api: hasSlot("backend"),
    client,
    // the ssr generator skips its build when there is no frontend
    ssr: client && hasSlot("ssr"),
  };
};

export const writeFolderManifest = async (sourceFolder: SourceFolder) => {
  const { createPath } = pathResolver(sourceFolder);
  const dir = createPath.distDir();
  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(dir, "kosmo.json"),
    JSON.stringify(folderManifestFactory(sourceFolder), undefined, 2),
    "utf8",
  );
};

export const runnerPath = ({ root, distDir }: ProjectSettings) => {
  return resolve(root, distDir, "run.js");
};

let runnerCode: string | undefined;

/**
 * The template is authored as TypeScript so it typechecks with the package;
 * the deployed file is plain JS. Stripping runs through the oxc transform
 * that vite already ships, once per process - preview redeploys after every rebuild.
 * */
const runnerCodeFactory = async (): Promise<string> => {
  if (!runnerCode) {
    const { code } = await transformWithOxc(runTemplate, "run.ts", {
      sourcemap: false,
    });
    runnerCode = code;
  }
  return runnerCode;
};

/**
 * run.js is static - it holds no folder-specific data -
 * so rewriting it on every build, partial builds included, is idempotent.
 * */
export const deployRunner = async (projectSettings: ProjectSettings) => {
  const file = runnerPath(projectSettings);
  await mkdir(resolve(file, ".."), { recursive: true });
  await writeFile(file, await runnerCodeFactory(), "utf8");
  return file;
};
