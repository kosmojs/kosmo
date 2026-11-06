import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";

import { describe, expect, test } from "vitest";
import { createVitest, type TestRunResult } from "vitest/node";

import { DEFAULT_TEST_FILE } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

/**
 * Splat routes as the harness clients see them:
 *
 *   docs/{...path}                          a trailing splat
 *   file-manager/{...before}/static/{...after}  splats with nothing required after them
 *   files/{...dir}/[name]                   a splat followed by a required param
 *
 * A splat with nothing required after it is optional: the client and page.href
 * take no params, and an empty array means the same as leaving the splat out.
 * A required param after a splat still makes params mandatory.
 * */
const routes = [
  "docs/{...path}",
  "file-manager/{...before}/static/{...after}",
  "files/{...dir}/[name]",
];

const apiTest = `
  import { expect, test } from "vitest";
  import { prepareHarness } from "_/test/api";

  const { clients } = await prepareHarness("docs/{...path}");

  const docs = clients["docs/{...path}"];
  const manager = clients["file-manager/{...before}/static/{...after}"];
  const files = clients["files/{...dir}/[name]"];

  test("a trailing splat takes no params, an empty array, or segments", async () => {
    expect((await docs.GET()).body).toEqual({ params: {} });
    expect((await docs.GET([[]])).body).toEqual({ params: {} });
    expect((await docs.GET([["a", "b"]])).body).toEqual({
      params: { path: ["a", "b"] },
    });
  });

  test("splats with nothing required after them are all optional", async () => {
    expect((await manager.GET()).body).toEqual({ params: {} });
    expect((await manager.GET([[], ["x"]])).body).toEqual({
      params: { after: ["x"] },
    });
  });

  test("a required param after a splat keeps params mandatory", async () => {
    expect((await files.GET([[], "readme.md"])).body).toEqual({
      params: { name: "readme.md" },
    });
    // @ts-expect-error name is required
    void (() => files.GET([[]]));
  });
`;

const pagesTest = `
  import { expect, test } from "vitest";
  import { prepareHarness } from "_/test/pages";

  const { pages } = await prepareHarness("docs/{...path}");

  const docs = pages["docs/{...path}"];
  const manager = pages["file-manager/{...before}/static/{...after}"];
  const files = pages["files/{...dir}/[name]"];

  const pathOf = (href: string) => new URL(href).pathname;

  test("a trailing splat takes no params, an empty array, or segments", () => {
    expect(pathOf(docs.href())).toMatch(/\\/docs$/);
    expect(docs.href([[]])).toEqual(docs.href());
    expect(pathOf(docs.href([["a", "b"]]))).toMatch(/\\/docs\\/a\\/b$/);
  });

  test("splats with nothing required after them are all optional", () => {
    expect(pathOf(manager.href())).toMatch(/\\/file-manager\\/static$/);
    expect(manager.href([[], []])).toEqual(manager.href());
    expect(pathOf(manager.href([[], ["x"]]))).toMatch(
      /\\/file-manager\\/static\\/x$/,
    );
  });

  test("a required param after a splat keeps params mandatory", () => {
    expect(pathOf(files.href([[], "readme.md"]))).toMatch(/\\/files\\/readme\\.md$/);
    // @ts-expect-error name is required
    void (() => files.href());
  });
`;

const routeSource = `
  import { defineRoute } from "_/api";
  export default defineRoute(({ GET }) => [
    GET((ctx) => {
      ctx.body = { params: ctx.validated.params };
    }),
  ]);
`;

const pageSource = `
  export default function Page() {
    return <div>splat</div>;
  }
`;

// tsc errors reported against the given files, as tsc prints their paths
const typeErrorsIn = (project: string, files: Array<string>) => {
  const require = createRequire(import.meta.url);
  const pkgFile = require.resolve("typescript/package.json");
  const pkg = require(pkgFile);
  const tsc = resolve(dirname(pkgFile), pkg.bin.tsc || pkg.bin);

  return new Promise<Array<string>>((resolvePromise) => {
    execFile(
      process.execPath,
      [tsc, "--project", project, "--noEmit", "--pretty", "false"],
      { cwd: dirname(project) },
      (_error, stdout) => {
        const reported = files.map((file) => relative(dirname(project), file));
        resolvePromise(
          stdout.split("\n").filter((line) => {
            return reported.some((file) => line.startsWith(file));
          }),
        );
      },
    );
  });
};

describe("vitest harness: splat routes", async ({ afterAll }) => {
  const project = await setupTestProject(
    // koa matches path-to-regexp patterns directly, so it can route a request
    // that leaves out a splat before another segment; hono and h3 cannot
    { frontend: "react", backend: "koa" },
    {
      frontend: { test: { seed: false } },
      backend: { test: { seed: false } },
    },
  );

  const { createPath } = pathResolver(project.project, project.sourceFolder);

  const testFiles = [
    createPath.api(routes[0], DEFAULT_TEST_FILE),
    createPath.pages(routes[0], DEFAULT_TEST_FILE),
  ];

  const teardown = await project.bootstrapProject(async () => {
    await project.createApiRoutes(
      routes.map((name) => ({ name })),
      async () => () => routeSource,
    );
    await project.createPageRoutes(
      routes.map((name) => ({ name })),
      async () => () => pageSource,
    );
    await writeFile(testFiles[0], apiTest);
    await writeFile(testFiles[1], pagesTest);
  });

  const vitest = await createVitest({
    root: project.project.root,
    mode: "test",
    watch: false,
  });

  await vitest.standalone();

  afterAll(async () => {
    await vitest.close();
    await teardown();
  });

  test("calls typecheck, with @ts-expect-error marking the mandatory ones", async () => {
    const errors = await typeErrorsIn(
      createPath.src("tsconfig.json"),
      testFiles,
    );
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("calls build the expected paths and params", async () => {
    const { testModules, unhandledErrors }: TestRunResult =
      await vitest.runTestFiles(testFiles);

    // the result lists every module the vitest instance has run so far
    const requested = testModules.filter(({ moduleId }) => {
      return testFiles.includes(moduleId);
    });

    const failures = requested.flatMap((testModule) => {
      const errors = [
        ...testModule.errors(),
        ...[...testModule.children.allTests()].flatMap((testCase) => {
          return testCase.result().errors ?? [];
        }),
      ];
      return errors.map(({ message }) => `${testModule.moduleId}: ${message}`);
    });

    expect(failures, failures.join("\n")).toEqual([]);
    expect(unhandledErrors).toEqual([]);
    expect(requested.length).toEqual(testFiles.length);
  });
});
