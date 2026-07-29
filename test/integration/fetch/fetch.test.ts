import { load } from "cheerio";
import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestGroups } from ".";

const testGroups = await createTestGroups();

beforeAll(async () => {
  for (const { project } of testGroups) {
    await project.startServer();
  }
});

afterAll(async () => {
  for (const { project } of testGroups) {
    await project.teardown();
  }
});

for (const { name, tests } of testGroups) {
  describe(name, () => {
    for (const { project, path, params, headers, cookies, payload } of tests) {
      test(path, async ({ expect }) => {
        const { content } = await project.withPageContent(path, {
          headers,
          cookies,
        });

        const $ = load(content);

        if (process.env.DEBUG) {
          console.log([$("#app").html()]);
        }

        for (const origin of ["index", "layout"]) {
          const {
            //
            requestOrigin,
            ...response
          } = JSON.parse($(`#${origin}-data`).html() ?? "");

          expect(
            origin,
            JSON.stringify([origin, requestOrigin], undefined, 2),
          ).toEqual(requestOrigin);

          expect(
            Object.values(response.params),
            JSON.stringify([origin, params, response.params], undefined, 2),
          ).toEqual(params);

          if (headers) {
            expect(
              response.headers,
              JSON.stringify([origin, headers, response.headers], undefined, 2),
            ).toMatchObject(headers);
          }

          if (cookies) {
            expect(
              response.cookies,
              JSON.stringify([origin, cookies, response.cookies], undefined, 2),
            ).toMatchObject(cookies);
          }

          for (const [target, targetPayload] of Object.entries(payload)) {
            if (response[target].type === "Buffer") {
              expect(
                Buffer.from(response[target]),
                JSON.stringify(
                  [origin, targetPayload, response[target]],
                  undefined,
                  2,
                ),
              ).toEqual(Buffer.from(targetPayload as never));
            } else if (target === "form") {
              for (const entry of targetPayload as Array<object>) {
                for (const prop of Object.keys(entry)) {
                  expect(
                    response[target],
                    JSON.stringify(
                      [origin, prop, response[target]],
                      undefined,
                      2,
                    ),
                  ).toHaveProperty(prop);
                }
              }
            } else {
              expect(
                response[target],
                JSON.stringify(
                  [origin, targetPayload, response[target]],
                  undefined,
                  2,
                ),
              ).toEqual(targetPayload as never);
            }
          }
        }
      });
    }
  });
}
