import { resolve } from "node:path";

import type { TestProject } from "vitest/node";

import {
  defaults,
  type KosmoSettings,
  type ProjectSettings,
} from "@kosmojs/core";
import chassis, { findFreePortRange } from "@kosmojs/dev/chassis";
import { resolveHostAddress } from "@kosmojs/lib";

import { name } from "{{ createImport 'libCore' }}";
import kosmo from "{{ createImport 'src' 'kosmo.config' }}";

export default async (project: TestProject) => {
  const { frontend } = kosmo.config;

  if (!frontend) {
    throw new Error(
      `No frontend configured in ${defaults.srcDir}/${name}/kosmo.config.ts`,
    );
  }

  const packageJson = await import(
    resolve(project.config.root, "package.json"),
    { with: { type: "json" } }
  ).then<{ kosmo: KosmoSettings }>((e) => e.default);

  const [host] = resolveHostAddress(packageJson.kosmo, "devHost").split(":");
  const [port] = await findFreePortRange(host, 1);

  const settings: ProjectSettings = {
    root: project.config.root,
    sourceFolders: [
      {
        name,
        config: kosmo.config,
        generators: kosmo.generators,
      },
    ],
    devHost: [host, port].join(":"),
    previewHost: "/dev/null",
    distDir: "/dev/null",
  };

  const { restart, teardown } = await chassis("test", settings);

  project.provide(
    `KOSMO_TEST_URL:${name}:frontend`,
    `http://${settings.devHost}`,
  );

  // Restart server on every rerun
  project.onTestsRerun(async () => {
    await restart();
  });

  // Final cleanup
  return async () => {
    await teardown();
  };
};
