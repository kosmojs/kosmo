import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer as createNodeServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { serve } from "@hono/node-server";
import crc from "crc/crc32";
import got, { type Response } from "got";
import { createJiti } from "jiti";
import { compile } from "path-to-regexp";
import { chromium } from "playwright";
import { inject } from "vitest";

import {
  type BACKEND_FRAMEWORKS,
  createProject,
  createSourceFolder,
  type FRAMEWORKS,
} from "@kosmojs/cli";
import chassis from "@kosmojs/dev/chassis";
import {
  type FolderConfig,
  type ProjectSettings,
  pathResolver,
  pathTokensFactory,
  type SourceFolder,
} from "@kosmojs/lib";

import type { RouteName } from "./routes";

const pkgsDir = resolve(import.meta.dirname, "../../packages");
const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

const csr = inject("CSR");
const ssr = inject("SSR");

const browser = csr
  ? await chromium.launch({ headless: !process.env.DEBUG })
  : undefined;

const apiClient = got.extend({
  retry: {
    limit: 0, // ✅ Fast failures in tests
  },
  timeout: {
    request: 5000, // Also set reasonable timeout
  },
});

const PORT_RANGE = [40_600, 40_800];

export * from "./routes";

export const sourceFolderName = "test";

export const setupTestProject = async (opt?: {
  framework?: keyof typeof FRAMEWORKS;
  frameworkOptions?: Record<string, unknown>;
  backend?: keyof typeof BACKEND_FRAMEWORKS;
  skip?: (a: { ssr: boolean; csr: boolean }) => boolean;
}) => {
  const { framework, frameworkOptions, backend } = { ...opt };

  const skip = opt?.skip //
    ? opt.skip({ csr, ssr })
    : false;

  const devPort = await findFreePort();
  const baseURL = `http://localhost:${devPort}`;

  const tempDir = skip ? "" : await mkdtemp(resolve(tmpdir(), ".kosmojs-"));
  const projectRoot = resolve(tempDir, "app");

  const sourceFolder: SourceFolder = {
    name: sourceFolderName,
    config: {},
    root: projectRoot,
    baseurl: "/",
    apiurl: "/api",
    distDir: "dist",
  };

  const projectSettings: ProjectSettings = {
    root: projectRoot,
    sourceFolders: [sourceFolder],
    command: "serve",
    devPort,
  };

  let closeServer: () => Promise<void> | undefined;

  const cleanup = async () => {
    if (!skip) {
      await rm(tempDir, { recursive: true, force: true });
    }
  };

  const { createPath, createImport } = pathResolver(sourceFolder);
  const jiti = createJiti(projectRoot);

  type PageTemplateFactory = (a: {
    name: string;
    file: string;
    cssFile: string;
    cssText: string;
  }) => Promise<() => string>;

  const createPageRoute = async (
    name: string,
    file: string,
    templateFactory?: PageTemplateFactory,
  ) => {
    const fileExt = framework
      ? { solid: "tsx", react: "tsx", vue: "vue", mdx: "mdx" }[framework]
      : "ts";

    const filePath = createPath.pages(`${name}/${file}.${fileExt}`);

    const cssFile = `assets/${name}/${file}.css`;
    const cssText = `[id="${crc(name + file)}"]{content:"${name}/${file}"}`;

    await mkdir(dirname(filePath), { recursive: true });
    await mkdir(dirname(createPath.src(cssFile)), { recursive: true });

    const templateBuilder = templateFactory
      ? await templateFactory({
          file,
          name,
          cssFile: createImport.src([cssFile], { origin: "lib" }),
          cssText,
        })
      : () => "";

    await writeFile(filePath, templateBuilder());
    await writeFile(createPath.src(cssFile), cssText, "utf8");
  };

  type ApiTemplateFactory = (a: {
    name: string;
    file: string;
  }) => Promise<() => string>;

  const createApiRoute = async (
    name: string,
    file: string,
    templateFactory?: ApiTemplateFactory,
  ) => {
    const filePath = createPath.api(`${name}/${file}.ts`);

    await mkdir(dirname(filePath), { recursive: true });

    const templateBuilder = templateFactory
      ? await templateFactory({ file, name })
      : () => "";

    await writeFile(filePath, templateBuilder());
  };

  const createRoutePath = (
    routeName: string,
    params: Record<string, unknown> | undefined,
  ) => {
    const [, pathPattern] = pathTokensFactory(routeName);
    const toPath = compile(pathPattern);
    return toPath({ ...params } as never);
  };

  const createDevServer = async () => {
    if (ssr) {
      const { createServer } = await import(
        createPath.distDir("ssr/server.js")
      );

      const server = await createServer();

      server.listen(devPort);

      return async () => {
        await server.close();
      };
    }

    if (backend) {
      const app = await jiti.import<{ fetch: never; listen: Function }>(
        createPath.distDir("api/app.js"),
        { default: true },
      );

      const server =
        backend === "hono"
          ? serve({ fetch: app.fetch, port: devPort })
          : app.listen(devPort);

      return async () => {
        await server.close();
      };
    }

    const config = await jiti.import<FolderConfig>(
      createPath.src("kosmo.config.ts"),
      { default: true },
    );

    const teardown = await chassis({
      ...projectSettings,
      sourceFolders: [{ ...sourceFolder, config }],
    });

    return teardown;
  };

  const bootstrapProject = async () => {
    if (skip) {
      return;
    }

    await cleanup();

    await createProject(
      tempDir,
      { name: "app", ...projectSettings },
      {
        dependencies: {
          "@kosmojs/api": resolve(pkgsDir, "core/api"),
        },
        devDependencies: {
          "@kosmojs/cli": resolve(pkgsDir, "core/cli"),
          "@kosmojs/dev": resolve(pkgsDir, "core/dev"),
        },
      },
    );

    await createSourceFolder(
      projectRoot,
      {
        name: sourceFolder.name,
        ...(backend ? { backend } : {}),
        ...(framework ? { framework } : {}),
        ...(ssr ? { ssr: true } : {}),
      },
      {
        ...(frameworkOptions ? { frameworkOptions } : {}),
        devDependencies: {
          "@kosmojs/fetch": resolve(pkgsDir, "core/fetch"),
          "@kosmojs/lib": resolve(pkgsDir, "core/lib"),
        },
      },
    );
  };

  const defaultContentPatternFor = (route: string) => {
    return new RegExp(`data-page-route="${route.replace(/[[\]]/g, "\\$&")}"`);
  };

  const withPageContent = async (
    routeName: RouteName,
    paramsOrPath: Record<string, unknown> | string,
    callback?: (a: {
      path: string;
      content: string;
      defaultContentPattern: RegExp;
    }) => void | Promise<void>,
  ) => {
    const path =
      typeof paramsOrPath === "string"
        ? paramsOrPath
        : createRoutePath(routeName, paramsOrPath);

    const url =
      path === ""
        ? baseURL
        : path === "/"
          ? `${baseURL}/`
          : `${baseURL}/${path}`;

    let maybeContent: string | undefined;

    if (browser) {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Wait for page content to be rendered
      await page.waitForSelector("body:has-text('')", {
        timeout: 3_000,
      });

      maybeContent = await page.content();

      await page.close();
    } else {
      maybeContent = await apiClient(url).text();
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

  const withApiResponse = async (
    routeName: string,
    params?: Record<string, unknown>,
    callback?: (a: {
      path: string;
      response: Response;
    }) => void | Promise<void>,
  ) => {
    const path = createRoutePath(routeName, { ...params });

    const url = `${baseURL}/api/${path}`;

    const response = await apiClient(url);

    await callback?.({ path, response });

    return response;
  };

  return {
    skip,
    projectRoot,
    sourceFolder,
    withPageContent,
    withApiResponse,
    defaultContentPatternFor,
    bootstrapProject,
    async startServer() {
      if (skip) {
        return;
      }

      for (const args of [
        ["--dir", projectRoot, "--store-dir", pnpmDir, "install"],
        ["--dir", projectRoot, "build"],
      ]) {
        await new Promise((resolve, reject) => {
          execFile("pnpm", args, (error, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);
            error //
              ? reject(error)
              : resolve(true);
          });
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      closeServer = await createDevServer();
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      if (browser) {
        // Initial warmup navigation
        const page = await browser.newPage();
        await page.goto(baseURL, {
          waitUntil: "networkidle",
          // give enough time to connect to dev server and render the app.
          // WARN: do not decrease this timeout!
          timeout: 10_000,
        });
        await page.close();
      }
    },
    async createPageRoutes(
      routes: Array<{ name: string; file?: string }>,
      templateFactory?: PageTemplateFactory,
    ) {
      if (!skip) {
        for (const { name, file = "index" } of routes) {
          await createPageRoute(name, file, templateFactory);
        }
      }
    },
    async createApiRoutes(
      routes: Array<{ name: string; file?: string }>,
      templateFactory?: ApiTemplateFactory,
    ) {
      if (!skip) {
        for (const { name, file = "index" } of routes) {
          await createApiRoute(name, file, templateFactory);
        }
      }
    },
    async teardown() {
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

const findFreePort = async (): Promise<number> => {
  const [minPort, maxPort] = PORT_RANGE;

  const range = maxPort - minPort + 1;
  const startOffset = Math.floor(Math.random() * range);

  const ports = Array.from({ length: range }, (_, i) => {
    return minPort + ((startOffset + i) % range);
  });

  const result = await ports.reduce(
    async (prevPromise, port) => {
      const prev = await prevPromise;
      if (prev !== null) return prev;

      const isFree = await isPortFree(port);
      return isFree ? port : null;
    },
    Promise.resolve(null as number | null),
  );

  if (result === null) {
    throw new Error(`No free ports found in range ${minPort}-${maxPort}`);
  }

  return result;
};

const isPortFree = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = createNodeServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, "127.0.0.1");
  });
};
