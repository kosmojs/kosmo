import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { execa } from "execa";
import got from "got";
import kosmoFactory, { type Framework } from "kosmojs/factory";
import { chromium } from "playwright";
import { build, createServer } from "vite";

import routesFactory from "@kosmojs/dev/routes";
import { defaults, type PageRoute } from "@kosmojs/devlib";

import testRoutes from "./routes";

const app = {
  name: "__test_app",
  distDir: "dist",
};

const appRoot = resolve(import.meta.dirname, `../${app.name}`);
const pkgsDir = resolve(import.meta.dirname, "../../packages");
const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

const sourceFolder = "@front";
const sourceFolderPath = resolve(appRoot, sourceFolder);

const port = 4567;
const baseURL = `http://localhost:${port}`;

export { testRoutes };

export async function setupTestProject(framework: Framework, ssr: boolean) {
  const { createApp, createSourceFolder } = await kosmoFactory(
    resolve(appRoot, ".."),
    { NODE_VERSION: "22" },
  );

  await cleanup();

  await createApp(app, {
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
    app,
    {
      name: sourceFolder,
      baseurl: "/",
      port,
      framework,
      ssr,
    },
    {
      devDependencies: {
        [`@kosmojs/${framework.name}-generator`]: resolve(
          pkgsDir,
          `generators/${framework.name}-generator`,
        ),
        ["@kosmojs/ssr-generator"]: resolve(
          pkgsDir,
          "generators/ssr-generator",
        ),
      },
    },
  );

  await execa(
    "pnpm",
    ["install", "--ignore-workspace", "--store-dir", pnpmDir],
    {
      cwd: appRoot,
      stdio: "inherit",
    },
  );

  for (const { name } of testRoutes) {
    await createTestRoute(name);
  }

  const resolvedRoutes = await resolveRoutes();

  const closeServer = await createDevServer(ssr);

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
    await cleanup();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  };

  return {
    resolvedRoutes,
    withRouteContent,
    defaultContentPatternFor,
    teardown,
  };
}

const createTestRoute = async (routeName: string) => {
  const filePath = resolve(
    sourceFolderPath,
    `${defaults.pagesDir}/${routeName}/index.tsx`,
  );
  await mkdir(resolve(filePath, ".."), { recursive: true });
  await writeFile(filePath, ""); // Empty file - generator will fill it
};

const createRoutePath = (route: PageRoute, params: Array<string | number>) => {
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
    appRoot,
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

const createDevServer = async (ssr: boolean) => {
  if (ssr) {
    await build({
      root: sourceFolderPath,
    });

    // INFO: wait for files to persist
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    const { server } = await import(
      join(appRoot, app.distDir, sourceFolder, "ssr/index.js")
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

const cleanup = async () => {
  await rm(appRoot, { recursive: true, force: true });
};

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

process.on("exit", async () => {
  await cleanup();
});
