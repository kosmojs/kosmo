import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import crc from "crc/crc32";
import got from "got";
import { type Browser, chromium, type Page } from "playwright";
import { build, createServer } from "vite";

import {
  createProject,
  createSourceFolder,
  type FRAMEWORK_OPTIONS,
} from "@kosmojs/dev/cli";
import routesFactory from "@kosmojs/dev/routes";
import { defaults, type PageRoute, pathTokensFactory } from "@kosmojs/devlib";

const project = {
  name: "integration-test",
  distDir: "dist",
};

const pkgsDir = resolve(import.meta.dirname, "../../packages");
const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

export const sourceFolder = "@src";

const port = 4567;
const baseURL = `http://localhost:${port}`;

export * from "./routes";

export const setupTestProject = async ({
  framework,
  frameworkOptions,
  ssr,
  skip,
}: {
  framework: Exclude<(typeof FRAMEWORK_OPTIONS)[number], "none">;
  frameworkOptions?: Record<string, unknown>;
  ssr?: boolean;
  skip?: boolean;
}) => {
  const tempDir = skip ? "" : await mkdtemp(resolve(tmpdir(), ".kosmojs-"));
  const projectRoot = resolve(tempDir, project.name);

  const fileExt = {
    solid: "tsx",
    react: "tsx",
    vue: "vue",
  }[framework];

  let closeServer: () => Promise<void> | undefined;
  let browser: Browser | undefined;
  let page: Page | undefined;

  const cleanup = async () => {
    if (skip) {
      return;
    }
    await rm(tempDir, { recursive: true, force: true });
  };

  type TemplateFactory = (a: {
    name: string;
    file: string;
    cssFile: string;
    cssText: string;
  }) => Promise<() => string>;

  const createRoute = async (
    name: string,
    file: string,
    templateFactory?: TemplateFactory,
  ) => {
    const filePath = resolve(
      projectRoot,
      `${sourceFolder}/${defaults.pagesDir}/${name}/${file}.${fileExt}`,
    );

    const cssFile = `${sourceFolder}/assets/${name}/${file}.css`;
    const cssText = `[id="${crc(name + file)}"]{content:"${name}/${file}"}`;

    await mkdir(dirname(filePath), { recursive: true });
    await mkdir(dirname(resolve(projectRoot, cssFile)), { recursive: true });

    const templateBuilder = templateFactory
      ? await templateFactory({ file, name, cssFile, cssText })
      : () => "";

    await writeFile(filePath, templateBuilder());
    await writeFile(resolve(projectRoot, cssFile), cssText, "utf8");
  };

  const createRoutePath = (
    routeName: string,
    params: Array<string | number>,
  ) => {
    const paramsClone = structuredClone(params);
    return pathTokensFactory(routeName)
      .flatMap(({ path, param }) => {
        if (param?.isRest) {
          return paramsClone;
        }
        if (param) {
          return paramsClone.splice(0, 1);
        }
        return path ? [path] : [];
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
      const { kind, entry } = await handler();
      if (kind === "pageRoute") {
        resolvedRoutes.push(entry);
      }
    }

    return resolvedRoutes;
  };

  const createDevServer = async () => {
    if (ssr) {
      await build({
        root: resolve(projectRoot, sourceFolder),
      });

      // INFO: wait for files to persist
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const { createServer } = await import(
        join(projectRoot, project.distDir, sourceFolder, "ssr/index.js")
      );

      const server = await createServer();

      server.listen(port);

      return async () => {
        await server.close();
      };
    }

    const server = await createServer({
      root: resolve(projectRoot, sourceFolder),
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
    browser = await chromium.launch(
      process.env.DEBUG
        ? {
            headless: false,
          }
        : {},
    );

    page = await browser.newPage();

    // Initial warmup navigation
    await page.goto(baseURL, {
      waitUntil: "networkidle",
      // give enough time to connect to dev server and render the app.
      // WARN: do not decrease this timeout!
      timeout: 6_000,
    });
  };

  const bootstrapProject = async () => {
    if (skip) {
      return;
    }

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
  };

  const defaultContentPatternFor = (routeName: string) => {
    return new RegExp(
      `Edit this page at .*${routeName.replace(/[[\]]/g, "\\$&")}.*`,
      "i",
    );
  };

  const withRouteContent = async (
    routeName: string,
    paramsOrPath:
      | Record<string, Array<string | number> | string | number>
      | Array<string | number>
      | string,
    callback?: (a: {
      path: string;
      content: string;
      defaultContentPattern: RegExp;
    }) => void | Promise<void>,
  ) => {
    const path =
      typeof paramsOrPath === "string"
        ? paramsOrPath
        : createRoutePath(
            routeName,
            Array.isArray(paramsOrPath)
              ? paramsOrPath.flat()
              : Object.values(paramsOrPath).flat(),
          );

    const url =
      path === ""
        ? baseURL
        : path === "/"
          ? `${baseURL}/`
          : `${baseURL}/${path}`;

    let maybeContent: string | undefined;

    if (page) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Wait for page content to be rendered
      await page.waitForSelector("body:has-text('')", {
        timeout: 1_000,
      });

      maybeContent = await page.content();
    } else {
      maybeContent = await got(url).text();
    }

    const content = maybeContent ?? "";

    const data = {
      path,
      content,
      defaultContentPattern: defaultContentPatternFor(routeName),
    };

    await callback?.(data);

    return data;
  };

  return {
    projectRoot,
    sourceFolder,
    withRouteContent,
    defaultContentPatternFor,
    bootstrapProject,
    resolveRoutes,
    async startServer() {
      if (skip) {
        return;
      }
      closeServer = await createDevServer();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      if (!ssr) {
        await createBrowser(baseURL);
      }
    },
    async createRoutes(
      routes: Array<{ name: string; file?: string }>,
      templateFactory?: TemplateFactory,
    ) {
      if (!skip) {
        for (const { name, file } of routes) {
          await createRoute(name, file || "index", templateFactory);
        }
      }
      return routes;
    },
    async teardown() {
      await page?.close();
      await browser?.close();
      await closeServer?.();
      await cleanup();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    },
  };
};

export const snapshotNameFor = (
  name: string,
  params: Record<string, unknown>,
) => {
  return [
    name,
    Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join(";") || "index",
  ].join("/");
};
