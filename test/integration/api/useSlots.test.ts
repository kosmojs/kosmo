import { writeFile } from "node:fs/promises";

import { afterAll, beforeAll, describe, it } from "vitest";

import { pathResolver } from "@kosmojs/dev";

import { setupTestProject } from "../setup";

const {
  projectRoot,
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({ backend: "koa" });

const coreSlots = [
  "params",
  "validateParams",
  "bodyparser",
  "payload",
  "validatePayload",
  "validateResponse",
];

const { createPath, createImport } = pathResolver({
  appRoot: projectRoot,
  sourceFolder,
});

beforeAll(async () => {
  await bootstrapProject();

  // make sure core slots throws if not overridden
  const coreSlotsMapper = (slot: string) => {
    return `use(
      () => { throw new Error("${slot} slot supposed to be overridden"); },
      { slot: "${slot}" }
    )`;
  };

  await writeFile(
    createPath.api("use.ts"),
    `
      import { use } from "${createImport.libApi()}";
      export default [
        use(
          async (ctx, next) => {
            try {
              await next();
            } catch (error) {
              ctx.status = 400;
              ctx.body = error.message;
            }
          },
          { slot: "errorHandler" },
        ),
        ${coreSlots.map(coreSlotsMapper).join(",\n")}
      ]
    `,
  );

  for (const slot of coreSlots) {
    const route = {
      name: `should-throw/${slot}`,
      file: "index",
    };

    // override all but tested slot
    const coreSlotsMapper = (s: string) => {
      return s === slot
        ? [
            // not overriding tested slot, it should throw
          ]
        : [
            `use(
              (ctx, next) => { return next() }, // passthrough override
              { slot: "${s}" }
            )`,
          ];
    };

    await createApiRoutes([route], async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi(name)}";
          export default defineRoute(({ use, GET }) => [
            ${coreSlots.flatMap(coreSlotsMapper).join(",\n")},
            GET(() => {
              throw "should never reach here";
            }),
          ]);
        `;
      };
    });
  }

  for (const slot of coreSlots) {
    const route = {
      name: `should-override/${slot}`,
      file: "index",
    };

    const coreSlotsMapper = (s: string) => {
      return `use(
        (ctx, next) => {
          if ("${s}" === "${slot}") { ctx.body = "${slot}" };
          return next()
        },
        { slot: "${s}" }
      )`;
    };

    await createApiRoutes([route], async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi(name)}";
          export default defineRoute(({ use, GET }) => [
            ${coreSlots.map(coreSlotsMapper).join(",\n")},
            GET(async (ctx) => {
              // ctx.body set by overridden slot
            }),
          ]);
        `;
      };
    });
  }

  await startServer();
});

afterAll(teardown);

describe("API - useSlots", async () => {
  describe("Override Core Slots", async () => {
    for (const slot of coreSlots) {
      it(`should throw if not overridden: ${slot}`, async ({ expect }) => {
        try {
          await withApiResponse(`should-throw/${slot}`, []);
        } catch (error: any) {
          expect(error.response.body).toMatch(
            new RegExp(`${slot} slot supposed to be overridden`),
          );
        }
      });
    }

    for (const slot of coreSlots) {
      it(`should override slotted middleware: ${slot}`, async ({ expect }) => {
        const response = await withApiResponse(`should-override/${slot}`, []);
        expect(response.body).toEqual(slot);
      });
    }
  });
});
