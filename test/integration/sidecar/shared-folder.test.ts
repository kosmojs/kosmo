import { readFile, writeFile } from "node:fs/promises";

import { glob } from "tinyglobby";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { pathResolver } from "@kosmojs/lib";

import { setupTestProject } from "../setup";

/**
 * A sidecar sharing its folder with a web app: one `kosmo.config.ts` with all three blocks,
 * built by one build into the folder's api/, client/ and sidecar/.
 * The sidecar must not cost the web app anything - its routes included.
 * */
const ROUTE = "shared";

// only in the route and page sources; found in a build only if the routes were built
const API_MARKER = "shared-api-7c1e";
const PAGE_MARKER = "shared-page-3b9d";

const project = await setupTestProject({ frontend: "react", backend: "hono" });

const { createPath } = pathResolver(project.project, project.sourceFolder);

let teardown = async () => {};

beforeAll(async () => {
  teardown = await project.bootstrapProject(async () => {
    const configFile = createPath.src("kosmo.config.ts");
    const config = await readFile(configFile, "utf8");
    await writeFile(
      configFile,
      config.replace(
        "defineConfig({",
        "defineConfig({ sidecar: { serve: false },",
      ),
      "utf8",
    );

    await project.createApiRoutes([{ name: ROUTE }], async () => {
      return () => `
        import { defineRoute } from "_/api";
        export default defineRoute<"${ROUTE}">(({ GET }) => [
          GET((ctx) => ctx.json({ marker: "${API_MARKER}" })),
        ]);
      `;
    });

    await project.createPageRoutes([{ name: ROUTE }], async () => {
      return () => `
        export default function Page() {
          return <div>${PAGE_MARKER}</div>;
        }
      `;
    });
  });
}, 300_000);

afterAll(async () => {
  await teardown();
});

describe("sidecar sharing a folder with a web app", () => {
  test("builds the sidecar into dist/<folder>/sidecar", async () => {
    const entries = await glob("*.js", { cwd: createPath.distDir("sidecar") });
    expect(entries.sort()).toEqual(["entry.js", "run.js"]);
  });

  test("builds the backend routes", async () => {
    const files = await glob("**/*.js", {
      cwd: createPath.distDir("api"),
      absolute: true,
    });
    const contents = await Promise.all(files.map((f) => readFile(f, "utf8")));
    expect(contents.some((e) => e.includes(API_MARKER))).toBe(true);
  });

  test("builds the frontend routes", async () => {
    const files = await glob("**/*.js", {
      cwd: createPath.distDir("client"),
      absolute: true,
    });
    const contents = await Promise.all(files.map((f) => readFile(f, "utf8")));
    expect(contents.some((e) => e.includes(PAGE_MARKER))).toBe(true);
  });
});
