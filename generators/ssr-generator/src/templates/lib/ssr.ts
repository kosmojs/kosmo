import { access, chmod, constants, readFile, unlink } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, styleText } from "node:util";

import { createAdaptorServer, getRequestListener } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
import { glob } from "tinyglobby";

import type { FetchApp, NodeApp, SSRSetup } from "@kosmojs/core";

import { isFetchApp, redirectCodes, ssrOrigin } from "./@ssr/base";

import { routeMap } from "{{ createImport 'lib' '@ssr/routes' }}";
import { apiBase, base } from "{{ createImport 'libCore' }}";

const ROOT = import.meta.dirname;
const HEAD_CLOSE_PATTERN = /<\/head\s*>/i;

type AssetInfo = {
  file: string;
  // Raw file contents kept in memory for fast, zero-I/O responses.
  buffer: Uint8Array;
  // HTTP Content-Type header for this asset (derived from extension).
  contentType: string;
  // Cached size to set Content-Length without re-measuring the buffer.
  size: number;
};

export const createApp = async () => {
  // Import the SSR entry produced by Vite's ssr build.
  const {
    ssrApp,
    withSsrContext,
    errorProvider,
  }: {
    ssrApp: SSRSetup;
    withSsrContext: <T>(
      context: { headers?: Record<string, string>; url?: string },
      render: () => T,
    ) => Promise<T>;
    errorProvider: () => Error | undefined;
  } = await import(`${ROOT}/app.js`);

  // Read the client index.html that includes <!--app-html--> placeholder
  const template = await readFile(`${ROOT}/index.html`, "utf8");

  // Load the Vite manifest
  const manifest = await import(`${ROOT}/.vite/manifest.json`, {
    with: { type: "json" },
  }).then((e) => e.default);

  const { renderToString, renderToStream } = ssrApp;

  const [htmlStart, htmlEnd = ""] = template.split(/<!--\s*app-html\s*-->/);

  const assets = await loadAssets(ROOT);

  const ssrOptions = () => {
    const cssAssets = [...assets.entries()].flatMap(
      ([path, { file, buffer, size }]) => {
        // Vite is naming assets by entry name
        if (!/^__kosmo_ssr_bundle-.+\.css$/i.test(file)) {
          return [];
        }

        // skip if template contains a file with same hash
        if (template.includes(file.replace(/^__kosmo_ssr_bundle\b/, ""))) {
          return [];
        }

        return [
          {
            kind: "css" as const,
            tag: `<link rel="stylesheet" crossorigin href="${path}" />`,
            content: new TextDecoder().decode(buffer),
            size,
            path,
          },
        ];
      },
    );

    const content = "window.__KOSMO_HYDRATION_BOOL__ = true;";

    return {
      template,
      manifest,
      assets: [
        ...cssAssets,
        {
          kind: "js" as const,
          tag: `<script>${content}</script>`,
          content,
          size: content.length,
        },
      ],
    };
  };

  const injectHead = (html: string, head: string) => {
    const error = "WARN: missing </head> - required for SSR head injection";
    if (HEAD_CLOSE_PATTERN.test(html)) {
      return html.replace(HEAD_CLOSE_PATTERN, (headEnd) => {
        return [head, headEnd].join("\n");
      });
    }
    console.error(error);
    return `${html}\n<script>console.error("${error}")</script>`;
  };

  const renderPage = async (url: URL, ctx: Context) => {
    const {
      head = "",
      html,
      error,
    } = await withSsrContext(
      {
        headers: Object.fromEntries(ctx.req.raw.headers),
        url: ctx.req.url,
      },
      async () => {
        try {
          /**
           * Catch a hard SSR render failure and fall back to CSR,
           * where the client's error boundaries can surface a meaningful error.
           * Server-side error boundaries behave inconsistently across frameworks,
           * can not rely on them here.
           * Instead, the SSR output are discarded and the client shell served verbatim,
           * letting the client re-render and handle the error uniformly.
           * This is the render-level counterpart to the transport-level catch in loaders.
           * */
          const { head = "", html } = await renderToString(url, ssrOptions());
          return { head, html, error: errorProvider() };
        } catch (error) {
          return { error };
        }
      },
    );

    if (error) {
      const errorMessage = "WARN: SSR failed, fallback to CSR";
      console.error(errorMessage);
      console.error(error);
      console.error();
      return [
        injectHead(
          htmlStart,
          `<script>console.error("${errorMessage}")</script>`,
        ),
        htmlEnd,
      ].join("");
    }

    return [injectHead(htmlStart, head), html ?? "", htmlEnd].join("");
  };

  const app = new Hono({ strict: false });

  for (const { pathPattern, renderMode } of routeMap) {
    app.get(join(base, pathPattern), async (ctx) => {
      try {
        const url = new URL(ctx.req.url);

        if (renderMode === "string" && typeof renderToString === "function") {
          const page = await renderPage(url, ctx);
          return ctx.html(page);
        }

        if (renderMode === "stream" && typeof renderToStream === "function") {
          ctx.header("Content-Type", "text/html");
          return stream(ctx, async (stream) => {
            const { head = "", html } = await withSsrContext(
              {
                headers: Object.fromEntries(ctx.req.raw.headers),
                url: ctx.req.url,
              },
              () => renderToStream(url, ssrOptions(), stream as never),
            );
            await stream.write(injectHead(htmlStart, head));
            await stream.pipe(html);
            await stream.write(htmlEnd);
          });
        }

        ctx.status(501);
        return ctx.html("<h1>501: Not Implemented</h1>");
      } catch (error: any) {
        // Handle thrown Response instances as redirects.
        // Re-throw other errors for upstream handling.
        if (error instanceof Response) {
          const Location = error.headers.get("Location");

          if (!Location || !redirectCodes.includes(error.status)) {
            ctx.status(500);
            return ctx.html("<h1>500: Malformed redirect</h1>");
          }

          return ctx.redirect(Location, error.status as never);
        }
        throw new HTTPException(500, { message: error.message, cause: error });
      }
    });
  }

  app.get("/*", async (ctx) => {
    const { path } = ctx.req;

    // If incoming request path matches something cached at startup, serve it directly.
    // This covers JS, CSS, images, fonts, etc., including their .map siblings.
    const asset = assets.get(path);

    if (asset) {
      return new Response(asset.buffer as never, {
        headers: {
          "Content-Type": asset.contentType,
          "Content-Length": String(asset.size),
        },
      });
    }

    // render 404 page
    if (typeof renderToString === "function") {
      const url = new URL(ctx.req.url);
      const page = await renderPage(url, ctx);
      ctx.status(404);
      return ctx.html(page);
    }

    return ctx.notFound();
  });

  return app;
};

/**
 * Build an in-memory asset graph, loading asset content into memory.
 * The asset graph always includes every built asset URL so the SSR server
 * can correctly recognize static asset requests.
 * */
const loadAssets = async (
  root: string,
  patterns: string | Array<string> = "**",
) => {
  const mimeTypeMap: Record<string, string> = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".apng": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
  };

  // Resolve HTTP Content-Type from the asset's file extension.
  const contentTypeResolver = (filePath: string) => {
    const ext = extname(filePath).toLowerCase();
    return mimeTypeMap[ext] || "application/octet-stream";
  };

  // Map from URL path (as used in requests) to asset metadata.
  const assetCache = new Map<string, AssetInfo>();

  const folder = "assets";
  const cwd = resolve(root, folder);

  if (
    await access(cwd, constants.R_OK)
      .then(() => true)
      .catch(() => false)
  ) {
    const files = await glob(patterns, {
      cwd,
      onlyFiles: true,
      absolute: false,
    });

    for (const file of files) {
      const buffer = new Uint8Array(await readFile(resolve(cwd, file)));
      assetCache.set(join(base, folder, file), {
        file,
        buffer,
        contentType: contentTypeResolver(file),
        size: buffer?.length,
      });
    }
  }

  return assetCache;
};

type NodeListener = (req: IncomingMessage, res: ServerResponse) => void;

const createNodeListener = (app: FetchApp | NodeApp): NodeListener => {
  return isFetchApp(app)
    ? getRequestListener((app as FetchApp).fetch)
    : (app as NodeApp).callback();
};

export const startServer = async ({
  sock,
  port,
}: {
  sock?: string | undefined;
  port?: string | number | undefined;
}) => {
  if (![sock, port].some(Boolean)) {
    throw new Error("Please provide either -p/--port or -s/--sock");
  }

  const {
    apiApp,
  }: {
    apiApp: FetchApp | NodeApp;
  } = await import(`${ROOT}/app.js`);

  if (sock) {
    // Clean up any stale socket file before binding.
    await unlink(sock).catch((error) => {
      if (error.code === "ENOENT") {
        return;
      }
      console.error(error.message);
      process.exit(1);
    });
  }

  console.log(
    `\n  ➜ Starting SSR Server ${styleText(["dim"], "[ %s ]")}`,
    sock ? `sock: ${sock}` : `port: ${port}`,
  );

  const ssrApp = await createApp();
  const apiPrefix = join(base, apiBase);

  const ssrListener = createNodeListener(ssrApp as never);

  const apiListener = apiApp
    ? createNodeListener(apiApp as never)
    : async () => {};

  const gatewayListener: NodeListener = (req, res) => {
    const { pathname } = new URL(req.url ?? "/", ssrOrigin);
    return pathname === apiPrefix || pathname.startsWith(`${apiPrefix}/`)
      ? apiListener(req, res)
      : ssrListener(req, res);
  };

  const server = createServer(gatewayListener);

  server.listen(sock || port, async () => {
    if (sock) {
      // Make Unix socket world-writable so other processes (e.g. a reverse proxy)
      // can connect without permission issues.
      await chmod(sock, 0o777);
    }
    console.log("\n  ➜ Server Started ✨");
  });

  return server;
};

export const createDisposableServer = async (
  callback: (port: number) => Promise<void>,
) => {
  const app = await createApp();
  const server = createAdaptorServer(app).listen(0); // OS picks a free port
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("SSR: Failed starting disposable server on a free port");
  }

  try {
    await callback(address.port);
  } finally {
    server.close();
  }
};

const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  /**
   * Parse CLI arguments so this file can be used both as a module
   * and a standalone executable
   * */
  const {
    values: { port, sock },
  } = parseArgs({
    options: {
      port: {
        type: "string",
        short: "p",
      },
      sock: {
        type: "string",
        short: "s",
      },
    },
  });

  try {
    await startServer({ sock, port });
  } catch (error: any) {
    console.error(styleText("red", "✗ Failed starting SSR server"));
    console.error(error);
    process.exit(1);
  }
}
