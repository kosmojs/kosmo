import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  DEFAULT_DIST,
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PREVIEW_HOST,
  DEFAULT_PREVIEW_PORT,
} from "@kosmojs/core";
import { renderToFile, VERSION } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import * as templates from "./templates";

export const createProject = async (
  root: string,
  {
    devHost = [DEFAULT_HOST, DEFAULT_PORT].join(":"),
    previewHost = [DEFAULT_PREVIEW_HOST, DEFAULT_PREVIEW_PORT].join(":"),
    distDir = DEFAULT_DIST,
    dependencies,
    devDependencies,
  }: {
    devHost?: string;
    previewHost?: string;
    distDir?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = {},
) => {
  await mkdir(root, { recursive: true });

  const packageJson = {
    type: "module",
    kosmo: {
      devHost,
      previewHost,
      distDir,
    },
    scripts: {
      dev: "kosmo serve",
      preview: "kosmo preview",
      build: "kosmo build",
      typecheck: "kosmo typecheck",
      folder: "kosmo folder",
      sidecar: "kosmo sidecar",
    },
    dependencies: {
      "@kosmojs/core": `^${VERSION}`,
      ...dependencies,
    },
    devDependencies: {
      "@kosmojs/cli": `^${VERSION}`,
      "@kosmojs/dev": `^${VERSION}`,
      "@types/node": self.devDependencies["@types/node"],
      "@types/deno": self.devDependencies["@types/deno"],
      "@types/bun": self.devDependencies["@types/bun"],
      typescript: self.devDependencies["typescript"],
      vite: self.devDependencies["vite"],
      ...devDependencies,
    },
  };

  await renderToFile(
    resolve(root, "package.json"),
    JSON.stringify(packageJson, undefined, 2),
    {},
    {
      // overwrite regardless, project should start with a clean package.json
      overwrite: true,
    },
  );

  await renderToFile(
    resolve(root, ".gitignore"),
    templates.gitignore,
    {},
    { overwrite: false },
  );
};
