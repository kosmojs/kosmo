import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { format } from "oxfmt";
import { afterAll, describe, test } from "vitest";

import {
  BACKENDS,
  DEFAULT_DIST,
  DEFAULT_PORT,
  FRAMEWORKS,
} from "@kosmojs/core";

import { createBin, createTempDir, kosmoBin, run } from ".";

const tempDir = await createTempDir();

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("should create the project and folders", async () => {
  const projectName = "app";
  const projectRoot = resolve(tempDir, projectName);

  test("create the project", async ({ expect }) => {
    await mkdir(tempDir, { recursive: true });

    await run(
      createBin,
      [projectName, "--framework", "react", "--backend", "hono"],
      tempDir,
    );

    const packageJson = await import(resolve(projectRoot, "package.json"), {
      with: { type: "json" },
    }).then((e) => e.default);

    expect(packageJson.devPort).toEqual(DEFAULT_PORT);
    expect(packageJson.distDir).toEqual(DEFAULT_DIST);
  });

  const folders = [...Object.keys(FRAMEWORKS), undefined].flatMap(
    (framework) => {
      return [...Object.keys(BACKENDS), undefined].flatMap((backend) => {
        if (framework) {
          return ["ssr", undefined].map((ssr) => {
            const name = [framework, backend, ssr].filter(Boolean).join("-");
            return {
              name,
              base: `/${name}`,
              framework: framework as string | undefined,
              backend,
              ssr,
            };
          });
        }
        return backend
          ? [
              {
                name: backend,
                base: `/${backend}`,
                framework,
                backend,
                ssr: undefined,
              },
            ]
          : [];
      });
    },
  );

  for (const { name, base, framework, backend, ssr } of folders) {
    test(`create ${name} folder`, async ({ expect }) => {
      // the bin directly rather than the project's folder script:
      // the scaffolded project has no node_modules installed
      const { code, stderr } = await run(
        kosmoBin,
        [
          "folder",
          "--name",
          name,
          "--base",
          base,
          ...(framework ? ["--framework", framework] : ["--no-framework"]),
          ...(backend ? ["--backend", backend] : ["--no-backend"]),
          ...(ssr ? ["--ssr"] : []),
          "-q",
        ],
        projectRoot,
      );
      expect(code, stderr).toEqual(0);
      for (const file of [
        //
        "kosmo.config.ts",
      ] as const) {
        const fileContent = await readFile(
          resolve(projectRoot, `src/${name}/${file}`),
          "utf8",
        );
        const { code } = await format(file, fileContent);
        await expect(code).toMatchFileSnapshot(
          `./@snapshots/${name}/${file}.txt`,
        );
      }
    });
  }
});
