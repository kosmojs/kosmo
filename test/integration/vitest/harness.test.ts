import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import { describe, expect, test } from "vitest";
import { createVitest, type TestRunResult } from "vitest/node";

import { createSidecarFolder } from "@kosmojs/cli";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";
import { routes } from ".";

// the dev server answers with the client shell, the SSR preview with the rendered page
const pageAssertions = {
  csr: `expect(html).toContain("<!--app-html-->");`,
  ssr: `
    expect(html).not.toContain("<!--app-html-->");
    expect(html).toContain(">{{route.name}}<");
  `,
};

/**
 * Sidecar folders living next to the HTTP folder, the layout the docs recommend:
 * - worker has its tests enabled, and sets a Vite config both for itself and for testing;
 * - idle does not, so its test file must never be loaded, let alone run.
 * */
const SIDECAR = "worker";
const IDLE_SIDECAR = "idle";

const sidecarConfig = `
  import { defineConfig } from "@kosmojs/dev";
  export default defineConfig({
    sidecar: {
      entry: "./entry.ts",
      run: "./run.ts",
      serve: false,
      viteConfig: {
        define: { __SIDECAR_FLAG__: JSON.stringify("sidecar") },
      },
      test: {
        viteConfig: {
          define: { __TEST_FLAG__: JSON.stringify("test") },
        },
      },
    },
  });
`;

const idleSidecarConfig = `
  import { defineConfig } from "@kosmojs/dev";
  export default defineConfig({
    sidecar: { entry: "./entry.ts", run: "./run.ts", serve: false },
  });
`;

// read by the sidecar tests; only the folder's own env file defines it
const SIDECAR_ENV = { WORKER_GREETING: "hello from worker env" };

const greeting = JSON.stringify(SIDECAR_ENV.WORKER_GREETING);

/**
 * Test files of the worker folder, relative to it.
 * */
const sidecarTests: Record<string, string> = {
  "root.test.ts": `
    import { test, expect } from "vitest";
    import { greet } from "./lib/greet";
    declare const __SIDECAR_FLAG__: string;
    declare const __TEST_FLAG__: string;
    test("worker: root", () => {
      expect(greet("root")).toEqual("hello root");
      expect(process.env.WORKER_GREETING).toEqual(${greeting});
      expect(__SIDECAR_FLAG__).toEqual("sidecar");
      expect(__TEST_FLAG__).toEqual("test");
    });
  `,
  "lib/nested.test.ts": `
    import { test, expect } from "vitest";
    import { greet } from "./greet";
    test("worker: nested", () => {
      expect(greet("nested")).toEqual("hello nested");
      expect(process.env.WORKER_GREETING).toEqual(${greeting});
    });
  `,
  "lib/greet.ts": `
    export const greet = (name: string) => "hello " + name;
  `,
};

// the worker test files expected to load, relative to the worker folder
const sidecarTestFiles = ["root.test.ts", "lib/nested.test.ts"];

const idleSidecarTest = `
  import { test } from "vitest";
  test("idle: tests not enabled", () => {
    throw new Error("loaded a test file of a sidecar with tests not enabled");
  });
`;

// runTestFiles resolves whatever the inner tests do; their failures have to be read off the result
const expectAllPassed = (
  { testModules, unhandledErrors }: TestRunResult,
  files: Array<string>,
) => {
  // the result lists every module the vitest instance has run so far
  const requested = testModules.filter(({ moduleId }) => {
    return files.includes(moduleId);
  });
  const failures = requested.flatMap((testModule) => {
    return testModule.ok()
      ? []
      : [...testModule.children.allTests()].flatMap((testCase) => {
          return (
            testCase.result().errors?.map((error) => {
              return `${testCase.fullName}: ${error.message}`;
            }) ?? []
          );
        });
  });
  expect(failures, failures.join("\n")).toEqual([]);
  expect(unhandledErrors).toEqual([]);
  expect(requested.length).toEqual(files.length);
};

for (const ssr of [false, true]) {
  describe(`harness: ${ssr ? "ssr" : "csr"}`, async ({ afterAll }) => {
    const {
      project,
      sourceFolder,
      bootstrapProject,
      createApiRoutes,
      createPageRoutes,
    } = await setupTestProject(
      {
        backend: "koa",
        frontend: "solid",
      },
      {
        backend: {
          test: {
            seed: {
              "**": `
              import { test, expect } from "vitest";
              import { prepareHarness } from "_/test/api";
              const { client, clients, route } = await prepareHarness("{{route.name}}");
              test(route, async () => {
                expect(route).toEqual("{{route.name}}");
                const { response, body } = await client.GET();
                expect(response.status).toEqual(200);
                expect(body.route).toEqual(route);
              })
            `,
            },
          },
        },
        frontend: {
          ssr,
          test: {
            ssr,
            seed: {
              "**": `
              import { test, expect } from "vitest";
              import { prepareHarness } from "_/test/pages";
              const { page, pages, route } = await prepareHarness("{{route.name}}");
              test(route, async () => {
                expect(route).toEqual("{{route.name}}");
                const response = await fetch(page.href());
                expect(response.status).toEqual(200);
                const html = await response.text();
                ${ssr ? pageAssertions.ssr : pageAssertions.csr}
              })
            `,
            },
          },
        },
      },
    );

    const { createPath } = pathResolver(project, sourceFolder);

    // a file inside another source folder of the project
    const folderFile = (folder: string, ...path: Array<string>) => {
      return resolve(createPath.src(), "..", folder, ...path);
    };

    const writeFolderFile = async (
      folder: string,
      file: string,
      content: string,
    ) => {
      const path = folderFile(folder, file);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, "utf8");
    };

    const createSidecarFolders = async () => {
      for (const name of [SIDECAR, IDLE_SIDECAR]) {
        await createSidecarFolder(project.root, { name, sidecar: true });
      }

      await writeFolderFile(SIDECAR, "kosmo.config.ts", sidecarConfig);
      await writeFolderFile(
        SIDECAR,
        ".env",
        Object.entries(SIDECAR_ENV)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n"),
      );
      for (const [file, content] of Object.entries(sidecarTests)) {
        await writeFolderFile(SIDECAR, file, content);
      }

      await writeFolderFile(IDLE_SIDECAR, "kosmo.config.ts", idleSidecarConfig);
      await writeFolderFile(IDLE_SIDECAR, "sidecar.test.ts", idleSidecarTest);
    };

    const teardown = await bootstrapProject(async () => {
      await createSidecarFolders();

      await createApiRoutes(
        routes.map((name) => ({ name })),
        async ({ name }) => {
          return () => `
          import { defineRoute } from "_/api";
          export default defineRoute<"${name}">(({ GET }) => [
            GET((ctx) => { ctx.body = { route: "${name}" }; }),
          ]);
        `;
        },
      );

      await createPageRoutes(
        routes.map((name) => ({ name })),
        async ({ name }) => {
          return () => `
          export default function Page() {
            return <div>{"${name}"}</div>;
          };
        `;
        },
      );
    });

    const vitest = await createVitest({
      root: project.root,
      mode: "test",
      watch: false,
    });

    await vitest.standalone();

    afterAll(async () => {
      await vitest.close();
      await teardown();
    });

    test("backend", async () => {
      const files = routes.map((route) => {
        return createPath.api(route, "index.test.ts");
      });
      expectAllPassed(await vitest.runTestFiles(files), files);
    });

    test("frontend", async () => {
      const files = routes.map((route) => {
        return createPath.pages(route, "index.test.ts");
      });
      expectAllPassed(await vitest.runTestFiles(files), files);
    });

    test("sidecar: loads its test files, only from a folder with tests enabled", async () => {
      const specs = await vitest.globTestSpecifications();

      const loaded = specs.map(({ project: { name }, moduleId }) => {
        return [name, relative(project.root, moduleId)];
      });

      const sidecarFiles = sidecarTestFiles.map((file) => {
        return relative(project.root, folderFile(SIDECAR, file));
      });

      const sidecarDirs = [SIDECAR, IDLE_SIDECAR].map((folder) => {
        return `${relative(project.root, folderFile(folder))}/`;
      });

      // every loaded file of the sidecar folders, under the project it was loaded in
      const fromSidecars = loaded.filter(([, file]) => {
        return sidecarDirs.some((dir) => file.startsWith(dir));
      });

      expect(fromSidecars.sort()).toEqual(
        sidecarFiles.map((file) => [`${SIDECAR}:sidecar`, file]).sort(),
      );
    });

    test("sidecar: runs them with the folder env and Vite config", async () => {
      const files = sidecarTestFiles.map((file) => folderFile(SIDECAR, file));
      expectAllPassed(await vitest.runTestFiles(files), files);
    });
  });
}
