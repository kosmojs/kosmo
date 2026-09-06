import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { transformWithOxc } from "vite";

import type {
  ProjectSettings,
  SourceFolder,
  SourceFolderManifest,
} from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import runTemplate from "#templates/run";

export const folderManifestFactory = (
  sourceFolder: SourceFolder,
): SourceFolderManifest => {
  const {
    name,
    config: { frontend, backend },
  } = sourceFolder;
  return {
    name,
    ...(frontend?.base ? { frontend: { base: frontend.base } } : {}),
    ...(backend?.base ? { backend: { base: backend.base } } : {}),
    ssr: frontend?.ssr ? true : false,
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
