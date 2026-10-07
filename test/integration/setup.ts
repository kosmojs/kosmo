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
  DEFAULT_DIST,
  DEFAULT_HOST,
  DEFAULT_PREVIEW_HOST,
  defaults,
  type FolderConfig,
  FRONTENDS,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { findFreePortRange, pathResolver } from "@kosmojs/lib";

import { dependencies } from "../package.json";
import {
  contentPatternFor,
  createRoutePath,
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
  const projectName = "app";
  const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));

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

  const baseVariants = [
    "/",
    ...(tempDir ? [tempDir] : []),
    ...(frontend ? [`/${frontend}`] : []),
  ];

  const base = baseVariants[Math.floor(Math.random() * baseVariants.length)];

  const sourceFolder: SourceFolder = {
    name: "test",
    config: {
      ...(frontend ? { frontend: { stack: frontend, base } } : {}),
      ...(backend
        ? { backend: { stack: backend, base: posix.join(base, "api") } }
        : {}),
    },
    generators: [],
  };

  const host = DEFAULT_HOST;
  const [port, previewPort] = await findFreePortRange(DEFAULT_HOST, 2);

  const project: ProjectSettings = {
    root: resolve(tempDir, projectName),
    sourceFolders: [sourceFolder],
    devHost: `${host}:${port}`,
    previewHost: `${DEFAULT_PREVIEW_HOST}:${previewPort}`,
    distDir: DEFAULT_DIST,
  };

  const { createPath, createImport } = pathResolver(project, sourceFolder);

  const cleanup = async () => {
    await rm(tempDir, { recursive: true, force: true });
  };

  const bootstrapProject = async (
    beforeBuild?: () => Promise<void>,
  ): Promise<() => Promise<void>> => {
    await cleanup();

    if (skip) {
      return cleanup;
    }

    await createProject(project.root, {
      ...project,
      dependencies: {
        mrmime: dependencies["mrmime"],
        "@kosmojs/core": `${pkgsDir}/core`,
      },
      devDependencies: {
        "@kosmojs/dev": `${pkgsDir}/dev`,
        "@kosmojs/cli": `${pkgsDir}/cli`,
      },
    });

    await createHTTPFolder(
      project.root,
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
        export default () => serve(app, { host: "${host}", port: ${port} });
      `,
      "utf8",
    );

    await beforeBuild?.();

    await installDependencies(project.root);

    const jiti = createJiti(project.root);

    const { config, generators } = await jiti.import<
      Pick<SourceFolder, "config" | "generators">
    >(createPath.src("kosmo.config.ts"), { default: true });

    await chassis("build", {
      ...project,
      sourceFolders: [{ ...sourceFolder, config, generators }],
    });

    let closeServer: () => Promise<void>;

    if (mode === "backend") {
      const { default: serve } = await import(
        createPath.distDir("api/server.js")
      );
      const server = await serve();
      closeServer = () => server.close();
    } else if (mode === "ssr") {
      const { startServer } = await import(createPath.distDir("ssr/server.js"));
      const server = await startServer({ host, port });
      closeServer = () => server.close();
    } else if (mode === "ssg") {
      const { startServer } = await import(createPath.distDir("../run.js"));
      const server = await startServer({ host, port });
      closeServer = () => server.close();
    } else if (mode === "csr") {
      const { teardown } = await chassis("serve", {
        ...project,
        sourceFolders: [{ ...sourceFolder, config, generators }],
      });
      closeServer = () => teardown();
    } else {
      throw new Error(`Unknown mode ${mode}`);
    }

    return async () => {
      await closeServer();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await cleanup();
    };
  };

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

  const createApiRoutes = async (
    routes: Array<{ name: string; file?: string }>,
    templateFactory?: ApiTemplateFactory,
  ) => {
    if (skip) {
      return;
    }
    for (const { name, file = "index" } of routes) {
      await createApiRoute(name, file, templateFactory);
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

  const createPageRoutes = async (
    routes: Array<{ name: string; file?: string }>,
    templateFactory?: PageTemplateFactory,
  ) => {
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
            url: `http://${project.devHost}`,
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

      await page.goto(`http://${project.devHost + path}`);
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

      maybeContent = await httpClient(`http://${project.devHost + path}`, {
        headers: {
          ...opts?.headers,
          ...(cookie ? { cookie } : {}),
        },
      }).text();
    }

    const content = maybeContent
      ? maybeContent
          .replace(/>\n+/g, ">")
          .replace(/\s+data-hk="[^"]*"/g, "")
          .replace(/<!--\[-->|<!--\]-->/g, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace("<!--app-html-->", "")
          .trim()
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
      `http://${project.devHost + createRoutePath(base, pathSource)}`,
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
      `http://${project.devHost + createRoutePath(base, pathSource)}`,
      { method, searchParams },
    );

    return { response };
  };

  return {
    project,
    sourceFolder,
    bootstrapProject,
    createApiRoutes,
    createPageRoutes,
    withPageContent,
    withPageResponse,
    withApiResponse,
  };
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
