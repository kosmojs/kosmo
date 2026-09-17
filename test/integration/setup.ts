import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, posix, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import { createProject } from "create-kosmo";
import got, { type Method } from "got";
import { createJiti } from "jiti";
import { chromium } from "playwright";
import { inject, type ProvidedContext } from "vitest";

import { createHTTPFolder } from "@kosmojs/cli";
import {
  BACKENDS,
  defaults,
  type FolderConfig,
  FRONTENDS,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathResolver } from "@kosmojs/lib";

import {
  buildProject,
  contentPatternFor,
  createRoutePath,
  findFreePort,
  installDependencies,
  pkgsDir,
} from ".";

// Lazy: launched on first use, so browser-free suites (ssg, cli, backend)
// run without playwright binaries installed.
let browserInstance: Awaited<ReturnType<typeof chromium.launch>> | undefined;

const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: process.env.DEBUG !== "browser",
    });
  }
  return browserInstance;
};

const httpClient = got.extend({
  retry: {
    limit: 0, // ✅ Fast failures in tests
  },
  timeout: {
    request: 5000, // Also set reasonable timeout
  },
});

export const setupTestProject = async (
  setup: {
    mode?: ProvidedContext["MODE"];
    frontend?: keyof typeof FRONTENDS | "random";
    backend?: keyof typeof BACKENDS;
    skip?: boolean;
  },
  folderConfig?: {
    frontend?: Omit<NonNullable<FolderConfig["frontend"]>, "stack" | "base">;
    backend?: Omit<NonNullable<FolderConfig["backend"]>, "stack" | "base">;
  },
) => {
  const devPort = await findFreePort();
  const baseURL = `http://localhost:${devPort}`;
  const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));

  const projectName = "app";
  const projectRoot = resolve(tempDir, projectName);

  const mode = setup.mode || inject("MODE");

  const {
    frontend: maybeFrontend,
    backend = ["ssr", "ssg"].includes(mode || "") ? pickBackend() : undefined,
    skip,
  } = setup;

  const frontend =
    maybeFrontend === "random"
      ? (Object.keys(FRONTENDS)[
          Math.floor(Math.random() * Object.keys(FRONTENDS).length)
        ] as keyof typeof FRONTENDS)
      : maybeFrontend;

  const baseVariants = ["/", tempDir, ...(frontend ? [`/${frontend}`] : [])];

  const base = baseVariants[Math.floor(Math.random() * baseVariants.length)];

  const sourceFolder: SourceFolder = {
    root: projectRoot,
    name: "test",
    config: {
      ...(frontend ? { frontend: { stack: frontend, base } } : {}),
      ...(backend
        ? { backend: { stack: backend, base: posix.join(base, "api") } }
        : {}),
    },
    generators: [],
    distDir: "dist",
  };

  const { createPath, createImport } = pathResolver(sourceFolder);
  const jiti = createJiti(projectRoot);

  const projectSettings: ProjectSettings = {
    root: projectRoot,
    sourceFolders: [sourceFolder],
    command: "serve",
    distDir: sourceFolder.distDir,
    devPort,
    previewPort: devPort + 1,
  };

  let closeServer: () => Promise<void> | undefined;

  const cleanup = async () => {
    await rm(tempDir, { recursive: true, force: true });
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
    const fileExt = frontend
      ? {
          solid: "tsx",
          react: "tsx",
          vue: "vue",
          svelte: "svelte",
          mdx: "mdx",
        }[frontend]
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

  const createServer = async (kind = mode) => {
    if (kind === "backend") {
      const { default: serve } = await import(
        createPath.distDir("api/server.js")
      );

      const server = await serve();

      return () => server.close();
    }

    if (kind === "ssr") {
      const { startServer } = await import(createPath.distDir("ssr/server.js"));

      const server = await startServer({ port: devPort });

      return () => server.close();
    }

    if (kind === "ssg") {
      const { startServer } = await import(createPath.distDir("../run.js"));

      const server = await startServer({ port: devPort });

      return () => server.close();
    }

    if (kind === "csr") {
      const { config, generators } = await jiti.import<
        Pick<SourceFolder, "config" | "generators">
      >(createPath.src("kosmo.config.ts"), { default: true });

      return chassis({
        ...projectSettings,
        sourceFolders: [{ ...sourceFolder, config, generators }],
      });
    }

    throw new Error(`Unknown mode ${kind}`);
  };

  const withPageContent = async <
    T extends
      | string
      | [route: string, params?: Record<string, unknown> | undefined],
  >(
    pathSource: T,
    opts?: {
      headers?: Record<string, string> | undefined;
      cookies?: Record<string, string> | undefined;
    },
  ) => {
    const base = sourceFolder.config.frontend?.base;

    if (!base) {
      throw new Error("frontend not configured");
    }

    const path = createRoutePath(base, pathSource);

    let maybeContent: string | undefined;

    // Only CSR needs a real browser - content renders client-side there.
    // SSR and SSG responses are complete HTML, asserted straight off the wire;
    // hydration behavior for SSR is covered by the CSR suite over the same fixtures.
    if (mode === "csr") {
      const browser = await getBrowser();

      const context = await browser.newContext({
        extraHTTPHeaders: { ...opts?.headers },
      });

      if (opts?.cookies) {
        await context.addCookies(
          Object.entries(opts.cookies).map(([name, value]) => ({
            name,
            value,
            url: baseURL,
          })),
        );
      }

      const page = await context.newPage();

      const pageErrors: Array<string> = [];

      page.on("pageerror", (error) => {
        pageErrors.push(`[pageerror] ${error.message}`);
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          pageErrors.push(`[console.error] ${msg.text()}`);
        }
      });

      await page.goto(baseURL + path);
      await page.waitForLoadState("networkidle");

      if (pageErrors.length) {
        console.error(
          [
            styleText(
              ["red", "italic"],
              `Browser reported ${pageErrors.length} error(s) at ${path}:`,
            ),
            ...new Set(pageErrors),
          ].join("\n"),
        );
      }

      maybeContent = await page.content();

      process.env.DEBUG === "browser" //
        ? await page.pause()
        : await page.close();
    } else {
      const cookie = Object.entries(opts?.cookies || {})
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");

      maybeContent = await httpClient(baseURL + path, {
        headers: {
          ...opts?.headers,
          ...(cookie ? { cookie } : {}),
        },
      }).text();
    }

    const content = maybeContent
      ? maybeContent.replace(/>\n+/g, ">").replace(/\s+data-hk="[^"]*"/g, "")
      : "";

    return {
      path: path.replace(posix.join(base, "/"), ""),
      content,
      contentPattern: Array.isArray(pathSource)
        ? contentPatternFor(pathSource[0])
        : /========================/,
    };
  };

  const withPageResponse = async <
    T extends
      | string
      | [route: string, params?: Record<string, unknown> | undefined],
  >(
    pathSource: T,
    {
      method = "GET",
      searchParams,
    }: { method?: Method; searchParams?: Record<string, string | number> } = {},
  ) => {
    const base = sourceFolder.config.frontend?.base;

    if (!base) {
      throw new Error("frontend not configured");
    }

    const response = await httpClient(
      baseURL + createRoutePath(base, pathSource),
      { method, searchParams },
    );

    return { response };
  };

  const withApiResponse = async <
    T extends
      | string
      | [route: string, params?: Record<string, unknown> | undefined],
  >(
    pathSource: T,
    {
      method = "GET",
      searchParams,
    }: { method?: Method; searchParams?: Record<string, string | number> } = {},
  ) => {
    const base = sourceFolder.config.backend?.base;

    if (!base) {
      throw new Error("backend not configured");
    }

    const response = await httpClient(
      baseURL + createRoutePath(base, pathSource),
      { method, searchParams },
    );

    return { response };
  };

  return {
    baseURL,
    devPort,
    projectRoot,
    sourceFolder,
    withPageContent,
    withPageResponse,
    withApiResponse,
    async bootstrapProject(opt?: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }) {
      if (skip) {
        return;
      }

      await cleanup();

      await createProject(
        resolve(tempDir, projectName),
        { name: projectName, devPort },
        {
          dependencies: {
            ...opt?.dependencies,
            "@kosmojs/core": `${pkgsDir}/core`,
          },
          devDependencies: {
            ...opt?.devDependencies,
            "@kosmojs/dev": `${pkgsDir}/dev`,
            "@kosmojs/cli": `${pkgsDir}/cli`,
          },
        },
      );

      await createHTTPFolder(
        projectRoot,
        { name: sourceFolder.name, frontend, backend },
        {
          ...(sourceFolder.config.frontend
            ? {
                frontend: {
                  ...(folderConfig?.frontend as {}),
                  base,
                  ssr:
                    mode === "ssr"
                      ? true
                      : "ssr" in { ...folderConfig?.frontend }
                        ? (folderConfig?.frontend?.ssr as boolean)
                        : false,
                  ssg:
                    mode === "ssg"
                      ? true
                      : "ssg" in { ...folderConfig?.frontend }
                        ? (folderConfig?.frontend?.ssg as boolean)
                        : false,
                },
              }
            : {}),
          ...(sourceFolder.config.backend
            ? {
                backend: {
                  ...(folderConfig?.backend as {}),
                  base: sourceFolder.config.backend.base,
                },
              }
            : {}),
        },
      );

      await mkdir(createPath.api(), { recursive: true });

      await writeFile(
        createPath.api("server.ts"),
        `
          import { serve } from "${defaults.libPrefix}/api:factory";
          import app from "./app";
          export default () => serve(app, { port: ${devPort} });
        `,
        "utf8",
      );

      await installDependencies(projectRoot);
    },
    async buildProject() {
      await installDependencies(projectRoot);
      await buildProject(projectRoot);
    },
    createServer,
    async startServer() {
      if (skip) {
        return;
      }

      await installDependencies(projectRoot);
      await buildProject(projectRoot);

      closeServer = await createServer();

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mode === "csr") {
        // Initial warmup navigation
        const browser = await getBrowser();
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
      if (skip) {
        return;
      }
      const created = new Set<string>();
      for (const { name, file = "index" } of routes) {
        // routes repeat a name once per params variant - one file each is enough;
        // index and layout of the same name are distinct files, so key on both
        const key = `${file}:${name}`;
        if (!created.has(key)) {
          await createPageRoute(name, file, templateFactory);
        }
        created.add(key);
      }
    },
    async createApiRoutes(
      routes: Array<{ name: string; file?: string }>,
      templateFactory?: ApiTemplateFactory,
    ) {
      if (skip) {
        return;
      }
      for (const { name, file = "index" } of routes) {
        await createApiRoute(name, file, templateFactory);
      }
    },
    async teardown() {
      if (skip) {
        return;
      }
      await browserInstance?.close();
      await closeServer?.();
      if (!process.env.KEEP_PROJECT) {
        await cleanup();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
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

const createBackendPicker = () => {
  const backends = Object.keys(BACKENDS) as Array<keyof typeof BACKENDS>;
  let i = 0;
  return {
    pick: () => backends[i++ % backends.length],
    reset: () => (i = 0),
  };
};

const { pick: pickBackend } = createBackendPicker();
