import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { format } from "oxfmt";
import { afterAll, describe, test } from "vitest";

import {
  BACKEND_FRAMEWORKS,
  DEFAULT_DIST,
  DEFAULT_PORT,
  FRAMEWORKS,
} from "@kosmojs/core";

import { env, exec, installDependencies, pkgsDir } from ".";

const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
  await rm(pkgsDir, { recursive: true, force: true });
});

describe("should create the project and folders", async () => {
  const projectName = "app";
  const projectRoot = resolve(tempDir, projectName);

  test("create the project", async ({ expect }) => {
    await mkdir(tempDir, { recursive: true });

    await exec(
      "node",
      [`${pkgsDir}/create-kosmo/pkg/cli.js`, "--name", projectName],
      { cwd: tempDir, env },
    );

    const packageJsonFile = resolve(projectRoot, "package.json");

    const packageJson = await import(packageJsonFile, {
      with: { type: "json" },
    }).then((e) => e.default);

    for (const key of ["dependencies", "devDependencies"]) {
      for (const pkg of Object.keys(packageJson[key]) as Array<string>) {
        if (pkg.includes("kosmo")) {
          packageJson[key][pkg] = resolve(pkgsDir, pkg);
        }
      }
    }

    await writeFile(
      packageJsonFile,
      JSON.stringify(packageJson, undefined, 2),
      "utf8",
    );

    await installDependencies(projectRoot);

    expect(packageJson.devPort).toEqual(DEFAULT_PORT);
    expect(packageJson.distDir).toEqual(DEFAULT_DIST);

    for (const file of ["tsconfig.json"] as const) {
      const fileContent = await readFile(resolve(projectRoot, file), "utf8");
      const { code } = await format(file, fileContent);
      await expect(code).toMatchFileSnapshot("./@snapshots/package.json.txt");
    }
  });

  const folders = [...Object.keys(FRAMEWORKS), undefined].flatMap(
    (framework) => {
      return [...Object.keys(BACKEND_FRAMEWORKS), undefined].flatMap(
        (backend) => {
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
        },
      );
    },
  );

  for (const { name, base, framework, backend, ssr } of folders) {
    test(`create ${name} folder`, async ({ expect }) => {
      await exec(
        "pnpm",
        [
          "+folder",
          "--name",
          name,
          "--base",
          base,
          ...(framework ? ["--framework", framework] : []),
          ...(backend ? ["--backend", backend] : []),
          ...(ssr ? ["--ssr"] : []),
        ],
        { cwd: projectRoot, env },
      );
      for (const file of ["kosmo.config.ts", "tsconfig.json"] as const) {
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
