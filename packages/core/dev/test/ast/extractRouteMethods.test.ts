import { describe, test } from "vitest";

import type { RequestBodyTarget } from "@kosmojs/api";

import {
  createProject,
  extractDefaultExport,
  extractRouteMethods,
} from "@src/ast";

describe("extractRouteMethods", () => {
  const project = createProject();

  const validationTargetMap: Array<[RequestBodyTarget, string]> = [
    ["json", "{ id?: number }"],
    ["form", "{ id?: number }"],
    ["raw", "string"],
  ];

  const route = { id: "test", name: "test" };

  test("detect methods", async ({ task, expect }) => {
    const defaultExport = extractDefaultExport(
      project.createSourceFile(
        `${task.id}.ts`,
        `
          export default defineRoute(({ GET, POST, PUT, PATCH, DELETE }) => [
            GET(),
            POST(),
            PUT(),
            PATCH(),
            DELETE(),
          ])
        `,
      ),
    );

    const methods = defaultExport
      ? extractRouteMethods(route, defaultExport)
      : [];

    await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
      `@snapshots/extractRouteMethods/detect methods.json`,
    );
  });

  for (const [target, schema] of validationTargetMap) {
    test(`with ${target} validation target`, async ({ task, expect }) => {
      const defaultExport = extractDefaultExport(
        project.createSourceFile(
          `${task.id}.ts`,
          `
            export default defineRoute(({ POST }) => [
              POST<{ ${target}: ${schema} }>(),
            ])
          `,
        ),
      );

      const methods = defaultExport
        ? extractRouteMethods(route, defaultExport)
        : [];

      await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
        `@snapshots/extractRouteMethods/with ${target} validation target.json`,
      );
    });
  }

  for (const [target, schema] of validationTargetMap) {
    test(`with response and ${target} validation target`, async ({
      task,
      expect,
    }) => {
      const defaultExport = extractDefaultExport(
        project.createSourceFile(
          `${task.id}.ts`,
          `
            export default defineRoute(({ POST }) => [
              POST<
                {
                  ${target}: ${schema},
                  response: [200, "json", { id: number } ],
                }
              >(),
            ])
          `,
        ),
      );

      const methods = defaultExport
        ? extractRouteMethods(route, defaultExport)
        : [];

      await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
        `@snapshots/extractRouteMethods/with response and ${target} validation target.json`,
      );
    });
  }

  for (const [target, schema] of validationTargetMap) {
    describe(`with contentType option for ${target} target`, () => {
      for (const [i, val] of ["json", "txt"].entries()) {
        test(val, async ({ task, expect }) => {
          const defaultExport = extractDefaultExport(
            project.createSourceFile(
              `${task.id}.ts`,
              `
                export default defineRoute(({ POST }) => [
                  POST<
                    { ${target}: ${schema} },
                    { ${target}: { contentType: "${val}" } }
                  >(),
                ])
              `,
            ),
          );

          const methods = defaultExport
            ? extractRouteMethods(route, defaultExport)
            : [];

          await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
            `@snapshots/extractRouteMethods/with contentType option for ${target} target:${i}.json`,
          );
        });
      }
    });
  }

  for (const [target, schema] of [
    ...validationTargetMap,
    ["response", `[200, "json"]`],
  ]) {
    describe(`with runtimeValidation option for ${target} target`, () => {
      for (const [i, val] of ["true", "false"].entries()) {
        test(val, async ({ task, expect }) => {
          const defaultExport = extractDefaultExport(
            project.createSourceFile(
              `${task.id}.ts`,
              `
                export default defineRoute(({ POST }) => [
                  POST<
                    { ${target}: ${schema} },
                    { ${target}: { runtimeValidation: ${val} } }
                  >(),
                ])
              `,
            ),
          );

          const methods = defaultExport
            ? extractRouteMethods(route, defaultExport)
            : [];

          await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
            `@snapshots/extractRouteMethods/with runtimeValidation option for ${target} target:${i}.json`,
          );
        });
      }
    });
  }

  for (const [target, schema] of [
    ...validationTargetMap,
    ["response", `[200, "json"]`],
  ]) {
    describe(`with error option for ${target} target`, () => {
      for (const [i, val] of [
        `{ error: "generic error", "error.id": "ID must be a number" }`,
      ].entries()) {
        test(val, async ({ task, expect }) => {
          const defaultExport = extractDefaultExport(
            project.createSourceFile(
              `${task.id}.ts`,
              `
                export default defineRoute(({ POST }) => [
                  POST<
                    { ${target}: ${schema} },
                    { ${target}: ${val} }
                  >(),
                ])
              `,
            ),
          );

          const methods = defaultExport
            ? extractRouteMethods(route, defaultExport)
            : [];

          await expect(JSON.stringify(methods, null, 2)).toMatchFileSnapshot(
            `@snapshots/extractRouteMethods/with error option for ${target} target:${i}.json`,
          );
        });
      }
    });
  }
});
