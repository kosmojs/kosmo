import { resolve } from "node:path";

import type { TestProject } from "vitest/node";

import {
  defaults,
  type KosmoSettings,
  type ProjectSettings,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import {
  findFreePortRange,
  loadEnvFiles,
  resolveHostAddress,
} from "@kosmojs/vitest";

import { name } from "{{ createImport 'libCore' }}";
import kosmoConfig from "{{ createImport 'src' 'kosmo.config' }}";

export default async (project: TestProject) => {
  const { root } = project.config;
  const { config, generators } = kosmoConfig;

  if (!config.frontend) {
    throw new Error(
      `No frontend configured in ${defaults.srcDir}/${name}/kosmo.config.ts`,
    );
  }

  const { mode } = project.vite.config;

  const packageJson = await import(resolve(root, "package.json"), {
    with: { type: "json" },
  }).then<{ kosmo: KosmoSettings }>((e) => e.default);

  const [host] = resolveHostAddress(packageJson.kosmo, "devHost").split(":");
  const [port] = await findFreePortRange(host, 1);

  const envSources = await loadEnvFiles({ root, name, mode, config });

  const settings: ProjectSettings = {
    mode,
    root: project.config.root,
    sourceFolders: [{ name, config, generators, envSources }],
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
