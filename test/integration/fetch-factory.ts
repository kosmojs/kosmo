import { mkdir } from "node:fs/promises";

import { load } from "cheerio";
import crc from "crc/crc32";
import { inject, type TestFunction } from "vitest";

import { BACKENDS, type FRAMEWORKS } from "@kosmojs/core";
import { pathResolver, render, renderToFile } from "@kosmojs/lib";

import { dependencies } from "../package.json";
import { payloadMap, routes } from "./@fixtures/fetch/routes";
import * as templates from "./@fixtures/fetch/templates";
import { setupTestProject } from "./setup";

export type TestGroup = {
  name: string;
  project: Awaited<ReturnType<typeof setupTestProject>>;
  tests: Array<[name: string, runner: TestFunction]>;
};

const mode = inject("MODE");

export const createTestGroups = async (opt: {
  framework: keyof typeof FRAMEWORKS;
  backends?: Array<keyof typeof BACKENDS>;
  renderModes?: Array<"string" | "stream">;
  tsqModes?: Array<boolean>;
  routes?: Array<keyof typeof routes>;
  skip?: boolean;
}) => {
  const testGroups: Array<TestGroup> = [];

  const { framework } = opt;

  const renderModes =
    mode === "ssr" //
      ? opt?.renderModes || ["string", "stream"]
      : [undefined];

  const tsqModes = Array.isArray(opt?.tsqModes) //
    ? opt.tsqModes
    : [false, true];

  for (const backend of opt?.backends || Object.keys(BACKENDS)) {
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
          mode,
          backend: backend as never,
          framework: framework as never,
          tsq,
          ...(renderMode ? { ssr: { renderMode } } : {}),
          ...(opt?.skip ? { skip: opt.skip } : {}),
        });

        const group: TestGroup = {
          name: [
            backend,
            framework,
            renderMode || mode,
            ...(tsq ? ["tsq"] : []),
          ].join(":"),
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
          { params: paramsEntries = [[]], headers, cookies, ...payloadEntries },
        ] of Object.entries(payloadMap)) {
          if (opt?.skip) {
            continue;
          }

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

                group.tests.push([
                  `[${mode}] ${path}`,
                  createTestRunner({
                    project,
                    route,
                    path,
                    params: params as never,
                    headers,
                    cookies,
                    payload,
                  }),
                ]);
              }
            }
          }
        }

        testGroups.push(group);
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
}: {
  project: TestGroup["project"];
  route: string;
  path: string;
  params: Array<string | Array<string>>;
  headers?: Record<string, string> | undefined;
  cookies?: Record<string, string> | undefined;
  payload: Record<string, unknown>;
}): TestFunction => {
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
  const { paramsRefinements, ...definitions } = {
    paramsRefinements: [],
    ...routes[route],
  };
  return render(templates[backend], {
    name: route,
    paramsRefinements,
    definitions: Object.entries(definitions).map(([method, type]) => ({
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

  const template =
    data.file === "index" //
      ? data.tsq
        ? `${data.framework}PageTsq`
        : `${data.framework}Page`
      : data.tsq
        ? `${data.framework}LayoutTsq`
        : `${data.framework}Layout`;

  return render(templates[template as never], {
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
