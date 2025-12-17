import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer as createNodeServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import crc from "crc/crc32";
import got, { type Response } from "got";
import { chromium } from "playwright";
import { build, createServer } from "vite";
import { inject } from "vitest";

import {
  createProject,
  createSourceFolder,
  type FRAMEWORK_OPTIONS,
} from "@kosmojs/dev/cli";
import { defaults, pathTokensFactory } from "@kosmojs/devlib";

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
  ? await chromium.launch({
      headless: !process.env.DEBUG,
    })
  : undefined;

const apiClient = got.extend({
  retry: {
    limit: 0, // ✅ Fast failures in tests
  },
  timeout: {
    request: 5000, // Also set reasonable timeout
  },
});

export const sourceFolder = "@src";

export * from "./routes";

export const setupTestProject = async (opt?: {
  framework?: Exclude<(typeof FRAMEWORK_OPTIONS)[number], "none">;
  frameworkOptions?: Record<string, unknown>;
  skip?: (a: { ssr: boolean; csr: boolean; api: boolean }) => boolean;
}) => {
  const { framework, frameworkOptions } = { ...opt };

  const skip = opt?.skip //
    ? opt.skip({ csr, ssr, api })
    : false;

  const port = await findFreePort(60_000, 60_200);
  const baseURL = `http://localhost:${port}`;

  const tempDir = skip ? "" : await mkdtemp(resolve(tmpdir(), ".kosmojs-"));
  const projectRoot = resolve(tempDir, project.name);

  let closeServer: () => Promise<void> | undefined;

  const cleanup = async () => {
    if (!skip) {
      await rm(tempDir, { recursive: true, force: true });
    }
  };

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

  type ApiTemplateFactory = (a: {
    name: string;
    file: string;
  }) => Promise<() => string>;

  const createApiRoute = async (
    name: string,
    file: string,
    templateFactory?: ApiTemplateFactory,
  ) => {
    const filePath = resolve(
      projectRoot,
      `${sourceFolder}/${defaults.apiDir}/${name}/${file}.ts`,
    );

    await mkdir(dirname(filePath), { recursive: true });

    const templateBuilder = templateFactory
      ? await templateFactory({ file, name })
      : () => "";

    await writeFile(filePath, templateBuilder());
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

  const createDevServer = async () => {
    if (ssr) {
      await build({
        root: resolve(projectRoot, sourceFolder),
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
        root: resolve(projectRoot, sourceFolder),
      });

      // INFO: wait for files to persist
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const createApp = await import(
        join(
          projectRoot,
          project.distDir,
          sourceFolder,
          defaults.apiDir,
          "app.js",
        )
      ).then((e) => e.default);

      const app = await createApp();
      const server = await app.listen(port);

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
        ...(framework ? { framework } : {}),
        ...(ssr ? { ssr: true } : {}),
      },
      {
        ...(frameworkOptions ? { frameworkOptions } : {}),
        devDependencies: {
          ...(framework
            ? {
                [`@kosmojs/${framework}-generator`]: resolve(
                  pkgsDir,
                  `generators/${framework}-generator`,
                ),
              }
            : {}),
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

  const withPageContent = async (
    routeName: string,
    paramsOrPath: Record<string, unknown> | Array<string> | string,
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
              : (Object.values(paramsOrPath).flat() as Array<string>),
          );

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
    paramsOrPath: Record<string, unknown> | Array<string> | string,
    callback?: (a: {
      path: string;
      response: Response;
    }) => void | Promise<void>,
  ) => {
    const path = createRoutePath(
      routeName,
      Object.values(paramsOrPath).flat() as Array<string>,
    );

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
        for (const { name, file } of routes) {
          await createPageRoute(name, file || "index", templateFactory);
        }
      }
    },
    async createApiRoutes(
      routes: Array<{ name: string; file: string }>,
      templateFactory?: ApiTemplateFactory,
    ) {
      if (!skip) {
        for (const { name, file } of routes) {
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

const findFreePort = async (
  minPort: number,
  maxPort: number,
): Promise<number> => {
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
