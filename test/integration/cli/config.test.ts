import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { format } from "oxfmt";
import { afterAll, describe, test } from "vitest";

import { BACKENDS, DEFAULT_DIST, DEFAULT_PORT, FRONTENDS } from "@kosmojs/core";

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
      [projectName, "--no-frontend", "--no-backend"],
      tempDir,
    );

    const packageJson = await import(resolve(projectRoot, "package.json"), {
      with: { type: "json" },
    }).then((e) => e.default);

    expect(packageJson.devPort).toEqual(DEFAULT_PORT);
    expect(packageJson.distDir).toEqual(DEFAULT_DIST);
  });

  const folders = [...Object.keys(FRONTENDS), undefined].flatMap((frontend) => {
    return [...Object.keys(BACKENDS), undefined].flatMap((backend) => {
      if (frontend) {
        return ["ssr", undefined].flatMap((ssr) => {
          return ["ssg", undefined].flatMap((ssg) => {
            return ["tsq", undefined].flatMap((tsq) => {
              const name = [frontend, backend, ssr, ssg, tsq]
                .filter(Boolean)
                .join("-");
              return [
                {
                  name,
                  frontend: frontend as string | undefined,
                  backend,
                  ssr,
                  ssg,
                  tsq,
                },
              ];
            });
          });
        });
      }
      return backend
        ? [
            {
              name: backend,
              frontend,
              backend,
              ssr: undefined,
              ssg: undefined,
              tsq: undefined,
            },
          ]
        : [];
    });
  });

  for (const { name, frontend, backend, ssr, ssg, tsq } of folders) {
    test(`create ${name} folder`, async ({ expect }) => {
      // the bin directly rather than the project's folder script:
      // the scaffolded project has no node_modules installed
      const { code, stderr } = await run(
        kosmoBin,
        [
          "folder",
          name,
          ...(frontend ? ["--frontend", frontend] : ["--no-frontend"]),
          ...(backend ? ["--backend", backend] : ["--no-backend"]),
          ...(ssr ? ["--ssr"] : []),
          ...(ssg ? ["--ssg"] : []),
          ...(tsq ? ["--tsq"] : []),
        ],
        projectRoot,
      );

      expect(code, stderr).toEqual(0);

      {
        const file = `src/${name}/kosmo.config.ts`;
        const fileContent = await readFile(resolve(projectRoot, file), "utf8");
        const { code } = await format(file, fileContent);
        await expect(code).toMatchFileSnapshot(`./@snapshots/${file}.txt`);
      }
    });
  }
});
