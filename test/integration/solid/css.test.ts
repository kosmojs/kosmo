import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { load } from "cheerio";
import crc from "crc/crc32";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import { routes, setupTestProject, sourceFolder } from "../setup";

const ssr = inject("SSR" as never);

const skip = !ssr;

describe(`SolidJS - Critical CSS: { ssr: ${ssr} }`, { skip }, async () => {
  const routeMap = [...new Set(routes.map((e) => e.name))].map((name) => {
    return {
      name,
      cssFile: `assets/${name}/base.css`,
      css: `a[data-test="${crc(name)}"]{content:"${name}"}`,
    };
  });

  const {
    sourceFolderPath,
    bootstrapProject,
    withRouteContent,
    createRoutes,
    startServer,
    teardown,
  } = await setupTestProject({
    skip,
    framework: "solid",
    frameworkOptions: {
      templates: routeMap.reduce(
        (map: Record<string, string>, { name, cssFile }) => {
          map[name] = `
            import "${sourceFolder}/${cssFile}";
            export default () => {
              return <div>${name}</div>;
            }
          `;
          return map;
        },
        {},
      ),
    },
    ssr,
  });

  await bootstrapProject();
  await createRoutes();

  beforeAll(startServer);
  afterAll(teardown);

  if (ssr) {
    for (const { cssFile, css } of routeMap) {
      await mkdir(dirname(resolve(sourceFolderPath, cssFile)), {
        recursive: true,
      });
      await writeFile(resolve(sourceFolderPath, cssFile), css, "utf8");
    }
  }

  for (const { name, params } of routes) {
    const snapshotName = [
      name,
      Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(";") || "index",
    ].join("/");

    it(snapshotName, async () => {
      const route = routeMap.find((e) => e.name === name);
      expect(route).toBeTruthy();
      await withRouteContent(name, params, async ({ content }) => {
        expect(content).toMatch(route?.css ?? "");
        const $ = load(content);
        const styles = $("style")
          .map((_, el) => $(el).html()?.trim())
          .get()
          .join("\n");
        await expect(styles).toMatchFileSnapshot(
          `../@snapshots/css/${snapshotName}.css`,
        );
      });
    });
  }
});
