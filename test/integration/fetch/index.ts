import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { load } from "cheerio";
import crc from "crc/crc32";
import { inject, type TestFunction } from "vitest";

import { BACKENDS, FRAMEWORKS } from "@kosmojs/core";
import { pathResolver, render, renderToFile } from "@kosmojs/lib";

import { dependencies } from "../../package.json";
import * as layouts from "../@fixtures/fetch/layouts";
import { payloadMap, routes } from "../@fixtures/fetch/routes";
import * as templates from "../@fixtures/fetch/templates";
import { setupTestProject } from "../setup";

type TestEntry = {
  project: TestGroup["project"];
  route: string;
  path: string;
  params: Array<string | Array<string>>;
  headers?: Record<string, string> | undefined;
  cookies?: Record<string, string> | undefined;
  payload: Record<string, unknown>;
};

export type TestGroup = {
  name: string;
  project: Awaited<ReturnType<typeof setupTestProject>>;
  tests: Array<TestEntry & { run: TestFunction }>;
};

const mode = inject("MODE");

export const createTestGroups = async (opt?: {
  backends?: Array<keyof typeof BACKENDS>;
  frameworks?: Array<keyof typeof FRAMEWORKS>;
  renderModes?: Array<"string" | "stream">;
  tsqModes?: Array<boolean>;
  routes?: Array<keyof typeof routes>;
}) => {
  const testGroups: Array<TestGroup> = [];

  const renderModes =
    mode === "ssr" //
      ? opt?.renderModes || ["string", "stream"]
      : [undefined];

  const tsqModes = Array.isArray(opt?.tsqModes) //
    ? opt.tsqModes
    : [false, true];

  for (const backend of opt?.backends || Object.keys(BACKENDS)) {
    for (const framework of opt?.frameworks || Object.keys(FRAMEWORKS)) {
      for (const renderMode of renderModes) {
        for (const tsq of tsqModes) {
          if (renderMode === "stream") {
            // mdx has no stream path, and svelte/server exposes only render() -
            // the svelte generator is string-only SSR (serverRenderFactory<false>)
            if (["mdx", "svelte"].includes(framework)) {
              continue;
            }
          }

          if (tsq) {
            // no tanstack query on mdx
            if (framework === "mdx") {
              continue;
            }
          }

          const project = await setupTestProject({
            backend: backend as never,
            framework: framework as never,
            tsq,
            ...(renderMode ? { ssr: { renderMode } } : {}),
          });

          const group: TestGroup = {
            name: [backend, framework, renderMode || mode].join(":"),
            project,
            tests: [],
          };

          const {
            sourceFolder,
            bootstrapProject,
            createApiRoutes,
            createPageRoutes,
          } = project;

          const { createPath } = pathResolver(sourceFolder);

          await bootstrapProject({
            dependencies: { mrmime: dependencies["mrmime"] },
          });

          await mkdir(createPath.lib(), { recursive: true });

          await renderToFile(
            createPath.lib("@testUtils.ts"),
            templates.testUtils,
            {},
          );

          await createApiRoutes(
            Object.keys(routes).map((name) => {
              return { name };
            }),
            async ({ name }) => {
              return () => renderApiFile(backend as never, name as never);
            },
          );

          for (const [
            route,
            {
              params: paramsEntries = [[]],
              headers,
              cookies,
              ...payloadEntries
            },
          ] of Object.entries(payloadMap)) {
            if (opt?.routes && !opt.routes.includes(route as never)) {
              continue;
            }

            for (const params of paramsEntries) {
              for (const [method, payloads] of Object.entries(payloadEntries)) {
                for (const payload of payloads) {
                  const path = [
                    route.replace(/[^\w]/g, "_"),
                    method,
                    ...params.flatMap((p) => (Array.isArray(p) ? p : [p])),
                    crc(route + JSON.stringify(payload)),
                  ].join("/");

                  for (const file of ["index", "layout"] as const) {
                    await createPageRoutes([{ name: path, file }], async () => {
                      return () => {
                        return renderPageFile({
                          framework: framework as never,
                          tsq,
                          route: route as never,
                          path,
                          params: JSON.stringify(params),
                          method,
                          payload,
                          file,
                        });
                      };
                    });
                  }

                  group.tests.push({
                    project,
                    route,
                    path,
                    params: params as never,
                    headers,
                    cookies,
                    payload,
                    run: createTestRunner({
                      project,
                      route,
                      path,
                      params: params as never,
                      headers,
                      cookies,
                      payload,
                    }),
                  });
                }
              }
            }
          }

          testGroups.push(group);
        }
      }
    }
  }

  return testGroups;
};

const createTestRunner = ({
  project,
  path,
  params,
  headers,
  cookies,
  payload,
}: TestEntry): TestFunction => {
  return async ({ expect }) => {
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
                JSON.stringify([origin, prop, response[target]], undefined, 2),
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
  };
};

const renderApiFile = (
  backend: keyof typeof BACKENDS,
  route: keyof typeof routes,
) => {
  return render(templates[backend], {
    definitions: Object.entries(routes[route]).map(([method, type]) => ({
      method,
      type,
    })),
  });
};

const renderPageFile = (data: {
  framework: keyof typeof FRAMEWORKS;
  tsq: boolean;
  route: keyof typeof routes;
  path: string;
  params: string;
  method: string;
  payload: Record<string, unknown>;
  file: "index" | "layout";
}) => {
  const payload = Object.entries(data.payload).map(([key, val]) => {
    if (key === "form") {
      const [a1, a2] = (val as Array<unknown>).map((e) => JSON.stringify(e));
      return { key, val: `formDataFactory(${a1}, ${a2})` };
    }
    return { key, val: JSON.stringify(val) };
  });

  const templateName = data.tsq //
    ? `${data.framework}Tsq`
    : `${data.framework}`;

  const template =
    data.file === "index" //
      ? templates[templateName as never]
      : layouts[templateName as never];

  return render(template, {
    ...data,
    payload: [
      ...payload,
      {
        key: "headers",
        val: JSON.stringify({ "x-request-origin": data.file }),
      },
    ],
    loaderHash: crc(JSON.stringify(data)),
  });
};
