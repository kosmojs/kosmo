import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import crc from "crc/crc32";
import { inject } from "vitest";

import { BACKEND_FRAMEWORKS, defaults, FRAMEWORKS } from "@kosmojs/core";
import { pathResolver } from "@kosmojs/lib";

import { dependencies } from "../../package.json";
import { payloadMap, routes } from "../@fixtures/fetch/routes";
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
  tests: Array<TestEntry>;
};

const mode = inject("MODE");

export const createTestGroups = async (opt?: {
  backends?: Array<keyof typeof BACKEND_FRAMEWORKS>;
  frameworks?: Array<keyof typeof FRAMEWORKS>;
  renderModes?: Array<"string" | "stream">;
  routes?: Array<keyof typeof routes>;
}) => {
  const testGroups: Array<TestGroup> = [];

  const renderModes =
    mode === "ssr" //
      ? opt?.renderModes || ["string", "stream"]
      : [undefined];

  for (const backend of opt?.backends || Object.keys(BACKEND_FRAMEWORKS)) {
    for (const framework of opt?.frameworks || Object.keys(FRAMEWORKS)) {
      for (const renderMode of renderModes) {
        if (framework === "mdx" && renderMode === "stream") {
          continue;
        }

        const project = await setupTestProject({
          backend: backend as never,
          framework: framework as never,
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

        await copyFile(
          resolve(import.meta.dirname, "../@fixtures/fetch/@testUtils.ts"),
          createPath.lib("@testUtils.ts"),
        );

        await createApiRoutes(
          Object.keys(routes).map((name) => {
            return { name };
          }),
          async ({ name }) => {
            return () => renderApiEndpoint(backend as never, name as never);
          },
        );

        for (const [
          route,
          { params: paramsEntries = [[]], headers, cookies, ...payloadEntries },
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
                      return renderPageComponent(
                        framework as never,
                        route as never,
                        {
                          params: JSON.stringify(params),
                          method,
                          payload,
                          file,
                        },
                      );
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
                });
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

const renderApiEndpoint = (
  backend: keyof typeof BACKEND_FRAMEWORKS,
  route: keyof typeof routes,
) => {
  const methods = Object.keys(routes[route]);

  const definitions = Object.entries(routes[route]).map(([meth, type]) => {
    return `
      ${meth}<${type}>((ctx) => {
        ${
          backend === "koa" //
            ? "ctx.body = ctx.validated;"
            : "return ctx.json(ctx.validated);"
        }
      })
    `.trim();
  });

  return `
    import { defineRoute } from "${defaults.libPrefix}/api";
    export default defineRoute(({ ${methods.join(", ")} }) => [
      ${definitions.join(",\n")}
    ]);
  `.trim();
};

const renderPageComponent = (
  framework: keyof typeof FRAMEWORKS,
  route: keyof typeof routes,
  data: {
    params: string;
    method: string;
    payload: Record<string, unknown>;
    file?: "index" | "layout";
  },
) => {
  const renderBaseImports = `
import f from "${defaults.libPrefix}/fetch";
import { formDataFactory } from "${defaults.libPrefix}/@testUtils";
  `;

  const payload = Object.entries(data.payload).map(([k, v]) => {
    if (k === "form") {
      const [a1, a2] = (v as Array<unknown>).map((e) => JSON.stringify(e));
      return `${k}: formDataFactory(${a1}, ${a2})`;
    }
    return `"${k}": ${JSON.stringify(v)}`;
  });

  const fetchInvocation = `f["${route}"].${data.method}(
    ${data.params},
    { ${payload.join(", ")} }
  )`;

  if (data.file === "index") {
    return {
      solid: `
import { Suspense } from "solid-js";
import { query, createAsync } from "@solidjs/router";
${renderBaseImports}
const getData = query(() => ${fetchInvocation}, "${route}:${crc(fetchInvocation)}");
export default function Page() {
  const data = createAsync(() => getData());
  return <Suspense>
    <div id="data">{JSON.stringify(data())}</div>
  </Suspense>
}`,

      react: `
import { useLoaderData } from "react-router";
${renderBaseImports}
export const loader = () => ${fetchInvocation};
export default function Page() {
  const data = useLoaderData();
  return <div id="data">{JSON.stringify(data)}</div>;
}`,

      vue: `
<script lang="ts">
${renderBaseImports}
export const loader = () => {
  return ${fetchInvocation};
};
</script>
<script setup lang="ts">
import { useLoaderData } from "${defaults.libPrefix}/use";
const data = useLoaderData();
</script>
<template>
<div id="data" v-html="JSON.stringify(data)"></div>
</template>
`,

      mdx: `
${renderBaseImports}
import { useLoaderData } from "${defaults.libPrefix}/use";
export const loader = () => ${fetchInvocation};
export { useLoaderData };

<div id="data" dangerouslySetInnerHTML={{ __html: JSON.stringify(useLoaderData()) }} />
`,
    }[framework];
  }

  return {
    solid: `
import { Suspense } from "solid-js";
import { query, createAsync } from "@solidjs/router";
${renderBaseImports}
const getData = query(() => ${fetchInvocation}, "${route}:${crc(fetchInvocation)}");
export default function Layout(props) {
  const data = createAsync(() => getData());
  return <Suspense>
    <div id="layout-data">{JSON.stringify(data())}</div>
    {props.children}
  </Suspense>
}`,

    react: `
import { Outlet } from "react-router";
import { useLoaderData } from "react-router";
${renderBaseImports}
export const loader = () => ${fetchInvocation};
export default function Layout() {
  const data = useLoaderData();
  return <>
    <div id="layout-data">{JSON.stringify(data)}</div>
    <Outlet />
  </>
}`,

    vue: `
<script lang="ts">
${renderBaseImports}
export const loader = () => {
  return ${fetchInvocation};
};
</script>
<script setup lang="ts">
import { useLoaderData } from "${defaults.libPrefix}/use";
const data = useLoaderData();
</script>
<template>
<div id="layout-data" v-html="JSON.stringify(data)"></div>
<RouterView />
</template>
`,

    mdx: `
${renderBaseImports}
import { useLoaderData } from "${defaults.libPrefix}/use";
export const loader = () => ${fetchInvocation};
export { useLoaderData };

<div id="layout-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(useLoaderData()) }} />
{props.children}
`,
  }[framework];
};
