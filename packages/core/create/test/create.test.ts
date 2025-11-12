import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";

import { globby } from "globby";
import { describe, expect, it, test } from "vitest";

import type { Project, SourceFolder } from "@/base";
import { createProject, createSourceFolder } from "@/factory";

describe("Create API", () => {
  it("should create default project", async (ctx) => {
    const { tempDir, createProject } = await cliFactory({
      name: "default-project",
    });

    ctx.tempDir = tempDir;

    const snapshot = await createProject();

    await expect(snapshot).toMatchFileSnapshot(
      "snapshots/default-project.json",
    );
  });

  it("should create project with custom dist folder", async (ctx) => {
    const { tempDir, createProject } = await cliFactory({
      name: "custom-dist-folder",
      distDir: "__dist",
    });

    ctx.tempDir = tempDir;

    const snapshot = await createProject();

    await expect(snapshot).toMatchFileSnapshot(
      "snapshots/custom-dist-folder.json",
    );
  });

  test("Source Folders", async (ctx) => {
    const project = { name: "with-source-folders" };
    const {
      //
      tempDir,
      createProject,
      createSourceFolder,
    } = await cliFactory(project);

    ctx.tempDir = tempDir;

    await createProject();

    for (const folder of [
      { name: "with-defaults" },
      { name: "with-custom-baseurl", baseurl: "/test" },
      { name: "with-custom-port", port: 5000 },
      { name: "with-solid", framework: "solid" },
      { name: "with-solid-ssr", framework: "solid", ssr: true },
      { name: "with-react", framework: "react" },
      { name: "with-react-ssr", framework: "react", ssr: true },
    ] satisfies Array<SourceFolder>) {
      const snapshot = await createSourceFolder(folder);
      await expect(snapshot).toMatchFileSnapshot(
        `snapshots/with-source-folders/${folder.name}.json`,
      );
    }
  });
});

const cliFactory = async (project: Project) => {
  const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));

  const generateSnapshot = async (patterns: Array<string> = ["**/*"]) => {
    const files = await globby(patterns, {
      cwd: resolve(tempDir, project.name),
      absolute: true,
      dot: true,
    });

    const snapshot: Record<string, unknown> = {};

    for (const path of files) {
      const key = relative(tempDir, path);
      if (path.endsWith("package.json")) {
        const json = await import(path, { with: { type: "json" } }).then((e) =>
          Object.entries(e.default).filter(([k]) => !/dependencies/i.test(k)),
        );
        snapshot[key] = json;
      } else {
        const content = await readFile(path, "utf8");
        snapshot[key] = content.trim().split("\n");
      }
    }

    return JSON.stringify(Object.entries(snapshot).sort(), null, 2);
  };

  return {
    tempDir,
    generateSnapshot,
    createProject: async () => {
      await createProject(tempDir, project);
      return generateSnapshot();
    },
    createSourceFolder: async (folder: SourceFolder) => {
      await createSourceFolder(resolve(tempDir, project.name), folder);
      return generateSnapshot([`**/${folder.name}/**/*`]);
    },
  };
};
