import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { format } from "node:util";

import got from "got";
import { chromium } from "playwright";
import { build, createServer } from "vite";

import routesFactory from "~/core/dev/src/base-plugin/routes";
import {
  createProject,
  createSourceFolder,
  type FRAMEWORK_OPTIONS,
} from "~/core/dev/src/cli";
import { defaults, type PageRoute } from "~/core/devlib/src";

import testRoutes from "./routes";

const project = {
  name: "integration-test",
  distDir: "dist",
};

const pkgsDir = resolve(import.meta.dirname, "../../packages");
const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

const sourceFolder = "@front";

const port = 4567;
const baseURL = `http://localhost:${port}`;

export { testRoutes };

export const setupTestProject = async ({
  framework,
  frameworkOptions,
  ssr,
}: {
  framework: Exclude<(typeof FRAMEWORK_OPTIONS)[number], "none">;
  frameworkOptions?: Record<string, unknown>;
  ssr?: boolean;
}) => {
  const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));
  const projectRoot = resolve(tempDir, project.name);
  const sourceFolderPath = resolve(projectRoot, sourceFolder);

  const cleanup = async () => {
    await rm(tempDir, { recursive: true, force: true });
  };

  const createTestRoute = async (routeName: string) => {
    const filePath = resolve(
      sourceFolderPath,
      format(
        `${defaults.pagesDir}/${routeName}/index.%s`,
        { solid: "tsx", react: "tsx", vue: "vue" }[framework],
      ),
    );
    await mkdir(resolve(filePath, ".."), { recursive: true });
    await writeFile(filePath, ""); // Empty file - generator will fill it
  };

  const createRoutePath = (
    route: PageRoute,
    params: Array<string | number>,
  ) => {
    const paramsClone = structuredClone(params);
    return route.pathTokens
      .flatMap(({ path, param }) => {
        if (param?.isRest) {
          return paramsClone;
        }
        if (param) {
          return paramsClone.splice(0, 1);
        }
        return [path];
      })
      .join("/");
  };

  const resolveRoutes = async () => {
    const { resolvers } = await routesFactory({
      generators: [],
      formatters: [],
      refineTypeName: "TRefine",
      watcher: { delay: 0 },
      baseurl: "",
      apiurl: "",
      appRoot: projectRoot,
      sourceFolder,
      outDir: "dist",
      command: "build",
    });

    const resolvedRoutes: PageRoute[] = [];

    for (const { handler } of resolvers.values()) {
      const { kind, route } = await handler();
      if (kind === "page") {
        resolvedRoutes.push(route);
      }
    }

    return resolvedRoutes;
  };

  const createDevServer = async () => {
    if (ssr) {
      await build({
        root: sourceFolderPath,
      });

      // INFO: wait for files to persist
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const { server } = await import(
        join(projectRoot, project.distDir, sourceFolder, "ssr/index.js")
      );

      server.listen(port);

      return async () => {
        await server.close();
      };
    }

    const server = await createServer({
      root: sourceFolderPath,
      logLevel: "error",
    });

    await server.listen();

    // INFO: wait for generators to deploy files!
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    return async () => {
      await server.close();
    };
  };

  const createBrowser = async (baseURL: string) => {
    const browser = await chromium.launch(
      process.env.DEBUG
        ? {
            headless: false,
            devtools: true,
          }
        : {},
    );

    const page = await browser.newPage();

    // Initial warmup navigation
    await page.goto(baseURL, {
      waitUntil: "networkidle",
      // give enough time to connect to dev server and render the app.
      // WARN: do not decrease this timeout!
      timeout: 6_000,
    });

    return { browser, page };
  };

  await cleanup();

  await createProject(tempDir, project, {
    dependencies: {
      "@kosmojs/api": resolve(pkgsDir, "core/api"),
    },
    devDependencies: {
      "@kosmojs/config": resolve(pkgsDir, "core/config"),
      "@kosmojs/dev": resolve(pkgsDir, "core/dev"),
      "@kosmojs/fetch": resolve(pkgsDir, "core/fetch"),
    },
  });

  await createSourceFolder(
    projectRoot,
    {
      name: sourceFolder,
      port,
      framework,
      ...(ssr ? { ssr: true } : {}),
    },
    {
      ...(frameworkOptions ? { frameworkOptions } : {}),
      devDependencies: {
        [`@kosmojs/${framework}-generator`]: resolve(
          pkgsDir,
          `generators/${framework}-generator`,
        ),
        ["@kosmojs/ssr-generator"]: resolve(
          pkgsDir,
          "generators/ssr-generator",
        ),
      },
    },
  );

  await new Promise((resolve, reject) => {
    execFile(
      "pnpm",
      ["install", "--dir", projectRoot, "--store-dir", pnpmDir],
      (error) => {
        error //
          ? reject(error)
          : resolve(true);
      },
    );
  });

  for (const { name } of testRoutes) {
    await createTestRoute(name);
  }

  const resolvedRoutes = await resolveRoutes();

  const closeServer = await createDevServer();

  const { browser, page } = ssr
    ? { browser: undefined, page: undefined }
    : await createBrowser(baseURL);

  const defaultContentPatternFor = (routeName: string | PageRoute) => {
    const route =
      typeof routeName === "string"
        ? resolvedRoutes.find((e) => e.name === routeName)
        : routeName;

    if (!route) {
      throw new Error(`${routeName} route not found`);
    }

    return new RegExp(
      `Edit this page at .*${route.name.replace(/[[\]]/g, "\\$&")}.*`,
      "i",
    );
  };

  const withRouteContent = async (
    routeName: string,
    params: Array<string | number>,
    callback: (a: {
      path: string;
      content: string;
      defaultContentPattern: RegExp;
    }) => void | Promise<void>,
  ) => {
    const route = resolvedRoutes.find((e) => e.name === routeName);

    if (!route) {
      throw new Error(`${routeName} route not found`);
    }

    const path = createRoutePath(route, params);

    let maybeContent: string | undefined;

    if (page) {
      await page.goto(`${baseURL}/${path}`);
      await page.waitForLoadState("networkidle");

      // Wait for page content to be rendered
      await page.waitForSelector("body:has-text('')", {
        timeout: 1_000,
      });
      maybeContent = await page.innerHTML("body");
    } else {
      maybeContent = await got(`${baseURL}/${path}`).text();
    }

    const content = maybeContent ?? "";

    await callback({
      path,
      content,
      defaultContentPattern: defaultContentPatternFor(route),
    });
  };

  const teardown = async () => {
    await page?.close();
    await browser?.close();
    await closeServer();
    // await cleanup();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  };

  return {
    resolvedRoutes,
    withRouteContent,
    defaultContentPatternFor,
    teardown,
  };
};
