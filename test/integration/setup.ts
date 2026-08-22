import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import got from "got";
import { createJiti } from "jiti";
import { chromium } from "playwright";
import { inject } from "vitest";

import { createProject, createSourceFolder } from "@kosmojs/cli";
import {
  BACKENDS,
  defaults,
  type FRAMEWORKS,
  type ProjectSettings,
  type SourceFolder,
} from "@kosmojs/core";
import chassis from "@kosmojs/dev/chassis";
import { pathResolver } from "@kosmojs/lib";

import {
  contentPatternFor,
  createRoutePath,
  env,
  exec,
  installDependencies,
} from ".";
import * as templates from "./@fixtures/templates";

export const mode = inject("MODE");

const browser = await chromium.launch({
  headless: process.env.DEBUG !== "browser",
});

const apiClient = got.extend({
  retry: {
    limit: 0, // ✅ Fast failures in tests
  },
  timeout: {
    request: 5000, // Also set reasonable timeout
  },
});

// Ports are allocated long before servers actually bind(dependency install and build run in between),
// so the range must sit below the kernel's ephemeral source-port range (32768-60999 on Linux);
// otherwise outbound connections made by pnpm/got/playwright during that window
// can take a port that was already checked as free.
const PORT_RANGE = [20_000, 29_999];

// Width of the sub-range reserved for each vitest worker process.
const PORTS_PER_WORKER = 500;

// Parallel workers each run their own copy of this module;
// scanning a worker-specific sub-range prevents two workers from picking the same port
// between the check and the actual bind.
const workerOffset =
  (Number(process.env.VITEST_POOL_ID ?? 0) * PORTS_PER_WORKER) %
  (PORT_RANGE[1] - PORT_RANGE[0] + 1);

// Cursor advancing through the worker's sub-range so the same port is
// never handed out twice within a worker, even before servers bind.
let portCursor = 0;

export const setupTestProject = async ({
  framework,
  backend = mode === "ssr" ? pickBackend() : undefined,
  tsq,
  skip,
  ...generatorOptions
}: {
  framework?: keyof typeof FRAMEWORKS;
  backend?: keyof typeof BACKENDS;
  tsq?: boolean;
  skip?: boolean;
} & Partial<
  Record<
    keyof typeof FRAMEWORKS | keyof typeof BACKENDS | "ssr",
    Record<string, unknown>
  >
>) => {
  const devPort = await findFreePort();
  const baseURL = `http://localhost:${devPort}`;
  const tempDir = await mkdtemp(resolve(tmpdir(), ".kosmojs-"));

  const projectName = "app";
  const projectRoot = resolve(tempDir, projectName);

  const baseVariants = ["/", `/${framework}`, tempDir];

  const sourceFolder: SourceFolder = {
    name: "test",
    config: {
      base: baseVariants[Math.floor(Math.random() * baseVariants.length)],
      apiBase: "/api",
    },
    root: projectRoot,
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
    await rm(tempDir, { recursive: true, force: true });
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
      ? {
          solid: "tsx",
          react: "tsx",
          vue: "vue",
          svelte: "svelte",
          mdx: "mdx",
        }[framework]
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

  const createDevServer = async () => {
    if (mode === "backend") {
      const serve = await jiti.import<() => Promise<{ close: Function }>>(
        createPath.distDir("api/server.js"),
        { default: true },
      );

      const server = await serve();

      return async () => {
        await server.close();
      };
    }

    if (mode === "ssr") {
      const { startServer } = await import(createPath.distDir("ssr/server.js"));

      const server = await startServer({ port: devPort });

      return async () => {
        server.close();
      };
    }

    if (mode === "csr") {
      const config = await jiti.import<SourceFolder["config"]>(
        createPath.src("kosmo.config.ts"),
        { default: true },
      );

      const teardown = await chassis({
        ...projectSettings,
        sourceFolders: [
          {
            ...sourceFolder,
            config,
          },
        ],
      });

      return teardown;
    }

    throw new Error(`Unknown mode ${mode}`);
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
    const path = Array.isArray(pathSource)
      ? createRoutePath(pathSource[0], pathSource[1])
      : pathSource;

    const url = [
      baseURL,
      path === ""
        ? sourceFolder.config.base
        : join(sourceFolder.config.base, path as never),
    ].join("");

    let maybeContent: string | undefined;

    if (browser) {
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

      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Wait for the client runtime to take over.
      // Fails loudly if hydration never happened.
      await page.waitForFunction(
        () => window.__APP_RENDERED__ === true,
        undefined,
        { timeout: 5_000 },
      );

      if (pageErrors.length) {
        console.error(
          [
            styleText(
              ["red", "italic"],
              `Browser reported ${pageErrors.length} error(s) at ${url}:`,
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
      maybeContent = await apiClient(url).text();
    }

    const content = maybeContent
      ? maybeContent.replace(/>\n+/g, ">").replace(/\s+data-hk="[^"]*"/g, "")
      : "";

    return {
      path,
      content,
      contentPattern: Array.isArray(pathSource)
        ? contentPatternFor(pathSource[0])
        : /========================/,
    };
  };

  const withApiResponse = async <
    T extends
      | string
      | [route: string, params?: Record<string, unknown> | undefined],
  >(
    pathSource: T,
  ) => {
    const path = Array.isArray(pathSource)
      ? createRoutePath(pathSource[0], pathSource[1])
      : pathSource;
    const url = baseURL + join(sourceFolder.config.base, "api", path as never);
    const response = await apiClient(url);
    return { response };
  };

  return {
    baseURL,
    devPort,
    projectRoot,
    sourceFolder,
    withPageContent,
    withApiResponse,
    async bootstrapProject(opt?: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }) {
      if (skip) {
        return;
      }

      await cleanup();

      const pkgsDir = resolve(import.meta.dirname, "../../packages");

      await createProject(
        tempDir,
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

      await createSourceFolder(
        projectRoot,
        {
          name: sourceFolder.name,
          base: sourceFolder.config.base,
          ...(framework ? { framework } : {}),
          ...(backend ? { backend } : {}),
          ...(tsq ? { tsq } : {}),
          ssr: mode === "ssr",
        },
        generatorOptions,
      );

      await writeFile(
        createPath.api("server.ts"),
        `
          import { serve } from "${defaults.libPrefix}/api:factory";
          import app from "./app";
          export default () => serve(app, { port: ${devPort} });
        `,
        "utf8",
      );

      if (framework) {
        const ext = {
          react: "tsx",
          solid: "tsx",
          vue: "vue",
          svelte: "svelte",
          mdx: "mdx",
        }[framework];

        await writeFile(
          createPath.src(`app.${ext}`),
          templates[`${framework}App`],
          "utf8",
        );
      }

      await installDependencies(projectRoot);
    },
    async startServer() {
      if (skip) {
        return;
      }

      await installDependencies(projectRoot);

      await exec("pnpm", ["build"], { cwd: projectRoot, env });

      closeServer = await createDevServer();

      await new Promise((resolve) => setTimeout(resolve, 100));

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
      if (skip) {
        return;
      }
      for (const { name, file = "index" } of routes) {
        await createPageRoute(name, file, templateFactory);
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
      await browser?.close();
      await closeServer?.();
      await cleanup();
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

const findFreePort = async (): Promise<number> => {
  const [minPort] = PORT_RANGE;

  for (let i = 0; i < PORTS_PER_WORKER; i++) {
    const port = minPort + workerOffset + ((portCursor + i) % PORTS_PER_WORKER);

    if (await isPortFree(port)) {
      portCursor = (portCursor + i + 1) % PORTS_PER_WORKER;
      return port;
    }
  }

  throw new Error(
    `No free ports found in worker range ${minPort + workerOffset}-${
      minPort + workerOffset + PORTS_PER_WORKER - 1
    }`,
  );
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

const isPortFree = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    // Bind the unspecified host, same as the servers under test do;
    // checking 127.0.0.1 alone misses ports taken only on "::".
    server.listen(port);
  });
};
