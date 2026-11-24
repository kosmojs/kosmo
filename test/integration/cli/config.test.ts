import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { format } from "oxfmt";
import { afterAll, describe, test } from "vitest";

import {
  BACKENDS,
  DEFAULT_DIST,
  DEFAULT_HOST,
  DEFAULT_PORT,
  FRONTENDS,
} from "@kosmojs/core";

import { createBin, createTempDir, kosmoBin, run } from ".";

const tempDir = await createTempDir();

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("should create the project and folders", async () => {
  const projectName = "app";
  const projectRoot = resolve(tempDir, projectName);

  await mkdir(tempDir, { recursive: true });

  const folders = [...Object.keys(FRONTENDS), undefined].flatMap((frontend) => {
    return [...Object.keys(BACKENDS), undefined].flatMap((backend) => {
      return [true, false].flatMap((sidecar) => [
        {
          name:
            [
              frontend,
              backend,
              sidecar ? (frontend || backend ? "with-sidecar" : "sidecar") : "",
            ]
              .filter(Boolean)
              .join("-") || "empty",
          frontend,
          backend,
          sidecar,
        },
      ]);
    });
  });

  test("create the project", async ({ expect }) => {
    await run(
      createBin,
      ["--name", projectName, "--frontend", Object.keys(FRONTENDS)[0]],
      tempDir,
    );

    const { kosmo } = await import(resolve(projectRoot, "package.json"), {
      with: { type: "json" },
    }).then((e) => e.default);

    expect(kosmo.devHost).toEqual([DEFAULT_HOST, DEFAULT_PORT].join(":"));
    expect(kosmo.distDir).toEqual(DEFAULT_DIST);
  });

  for (const { name, frontend, backend, sidecar } of folders) {
    test(`create ${name} folder`, async ({ expect }) => {
      // the bin directly rather than the project's folder script:
      // the scaffolded project has no node_modules installed
      const { code, stderr } = await run(
        kosmoBin,
        [
          "folder",
          "--name",
          name,
          ...(frontend ? ["--frontend", frontend] : []),
          ...(backend ? ["--backend", backend] : []),
          ...(sidecar ? ["--sidecar"] : []),
        ],
        projectRoot,
      );

      if ([frontend, backend, sidecar].some(Boolean)) {
        expect(code, stderr).toEqual(0);
        const file = `src/${name}/kosmo.config.ts`;
        const fileContent = await readFile(resolve(projectRoot, file), "utf8");
        const f = await format(file, fileContent);
        await expect(f.code).toMatchFileSnapshot(`./@snapshots/${file}.txt`);
      } else {
        expect(code, stderr).toEqual(1);
        expect(stderr).toMatch(/at least one/i);
      }
    });
  }
});
