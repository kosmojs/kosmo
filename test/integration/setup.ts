import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer as createNodeServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import crc from "crc/crc32";
import got, { type Response } from "got";
import { compile } from "path-to-regexp";
import { chromium } from "playwright";
import { build, createServer } from "vite";
import { inject } from "vitest";

import {
  type BACKEND_FRAMEWORKS,
  createProject,
  createSourceFolder,
  type FRAMEWORKS,
} from "@kosmojs/cli";
import { defaults, pathResolver, pathTokensFactory } from "@kosmojs/dev";

import type { RouteName } from "./routes";

const project = {
  name: "integration-test",
  distDir: "dist",
};

const pkgsDir = resolve(import.meta.dirname, "../../packages");
const pnpmDir = resolve(tmpdir(), ".kosmojs/pnpm-store");

const api = inject("API");
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

export const sourceFolder = "test";

export * from "./routes";

export const setupTestProject = async (opt?: {
  framework?: keyof typeof FRAMEWORKS;
  frameworkOptions?: Record<string, unknown>;
  backend?: keyof typeof BACKEND_FRAMEWORKS;
  skip?: (a: { ssr: boolean; csr: boolean; api: boolean }) => boolean;
}) => {
  const { framework, frameworkOptions, backend = "koa" } = { ...opt };

  const skip = opt?.skip //
    ? opt.skip({ csr, ssr, api })
    : false;

  const port = await findFreePort();
  const baseURL = `http://localhost:${port}`;

  const tempDir = skip ? "" : await mkdtemp(resolve(tmpdir(), ".kosmojs-"));
  const projectRoot = resolve(tempDir, project.name);

  let closeServer: () => Promise<void> | undefined;

  const cleanup = async () => {
    if (!skip) {
      await rm(tempDir, { recursive: true, force: true });
    }
  };

  const { createPath, createImport } = pathResolver({
    appRoot: projectRoot,
    sourceFolder,
  });

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
      ? { solid: "tsx", react: "tsx", vue: "vue" }[framework]
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
          cssFile: createImport.src(cssFile),
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
      await build({
        root: createPath.src(),
      });

      // INFO: wait for files to persist
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const { createServer } = await import(
        join(projectRoot, project.distDir, sourceFolder, "ssr/server.js")
      );

      const server = await createServer();

      server.listen(port);

      return async () => {
        await server.close();
      };
    }

    if (api) {
      await build({
        root: createPath.src(),
      });

      // INFO: wait for files to persist
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const app = await import(
        join(
          projectRoot,
          project.distDir,
          sourceFolder,
          defaults.apiDir,
          "app.js",
        )
      ).then((e) => e.default);

      const server = await app.listen(port);

      return async () => {
        await server.close();
      };
    }

    const server = await createServer({
      root: createPath.src(),
      logLevel: "error",
    });

    await server.listen();

    // INFO: wait for generators to deploy files!
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    return async () => {
      await server.close();
    };
  };

  const bootstrapProject = async () => {
    if (skip) {
      return;
    }

    await cleanup();

    await createProject(tempDir, project, {
      devDependencies: {
        "@kosmojs/config": resolve(pkgsDir, "core/config"),
        "@kosmojs/cli": resolve(pkgsDir, "core/cli"),
        "@kosmojs/dev": resolve(pkgsDir, "core/dev"),
        "@kosmojs/generators": resolve(pkgsDir, "generators/generators"),
      },
    });

    await createSourceFolder(
      projectRoot,
      {
        name: sourceFolder,
        port,
        backend,
        ...(framework ? { framework } : {}),
        ...(ssr ? { ssr: true } : {}),
      },
      {
        ...(frameworkOptions ? { frameworkOptions } : {}),
        dependencies: {
          "@kosmojs/api": resolve(pkgsDir, "core/api"),
        },
        devDependencies: {
          "@kosmojs/fetch": resolve(pkgsDir, "core/fetch"),
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
        timeout: 1_000,
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
