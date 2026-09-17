import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import type { Project } from "@kosmojs/cli";
import {
  DEFAULT_DIST,
  DEFAULT_PORT,
  DEFAULT_PREVIEW_PORT,
} from "@kosmojs/core";
import { renderToFile } from "@kosmojs/lib";

import self from "../package.json" with { type: "json" };
import * as templates from "./templates";

/**
 * Read the installed package.json at runtime to get the actual version.
 * A static import would be inlined by the bundler with the pre-bump version.
 *
 * INFO: For best compatibility, all packages should share the same version.
 * When bumping the version (even a patch) for a single package,
 * bump it for all packages to keep versions fully synchronized across the project.
 * */
const { version } = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve("create-kosmo/package.json"),
    "utf-8",
  ),
);

export const createProject = async (
  root: string,
  project: Project,
  projectDefaults?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
) => {
  await mkdir(root, { recursive: true });

  const packageJson = {
    type: "module",
    distDir: project.distDir || DEFAULT_DIST,
    devPort: project.devPort || DEFAULT_PORT,
    previewPort: project.previewPort || DEFAULT_PREVIEW_PORT,
    scripts: {
      dev: "kosmo serve",
      preview: "kosmo preview",
      build: "kosmo build",
      typecheck: "kosmo typecheck",
      folder: "kosmo folder",
      sidecar: "kosmo sidecar",
    },
    dependencies: {
      "@kosmojs/core": `^${version}`,
      ...projectDefaults?.dependencies,
    },
    devDependencies: {
      "@kosmojs/cli": `^${version}`,
      "@kosmojs/dev": `^${version}`,
      "@types/node": self.devDependencies["@types/node"],
      "@types/deno": self.devDependencies["@types/deno"],
      "@types/bun": self.devDependencies["@types/bun"],
      typescript: self.devDependencies["typescript"],
      vite: self.devDependencies["vite"],
      ...projectDefaults?.devDependencies,
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
