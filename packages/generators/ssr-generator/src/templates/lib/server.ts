import { chmod, readFile, unlink } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, styleText } from "node:util";

import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
import { glob } from "tinyglobby";

import type { SSROptions, SSRSetup } from "@kosmojs/core";

import { routeMap } from "./router";

import { baseurl } from "{{ createImport 'config' }}";

const CWD = import.meta.dirname;

/**
 * Root directory where Vite client assets are emitted.
 * This is used both for serving static files and for reading index.html + manifest.
 * */
const CLIENT_ASSETS_DIR = "../client";

/**
 * Vite also emits server-related assets that should be embeded into page.
 * */
const SERVER_ASSETS_DIR = ".";

const SERVE_STATIC_ASSETS = JSON.parse("{{serveStaticAssets}}");

const REDIRECT_CODES = [
  // Moved Permanently
  301,
  // Found (temporary)
  302,
  // See Other (redirect after POST)
  303,
  // Temporary Redirect (preserves method)
  307,
  // Permanent Redirect (preserves method)
  308,
];

type AssetInfo = {
  file: string;
  // Raw file contents kept in memory for fast, zero-I/O responses.
  // Can be undefined if `serveStaticAssets` option is false.
  buffer: Uint8Array | undefined;
  // HTTP Content-Type header for this asset (derived from extension).
  contentType: string;
  // Cached size to set Content-Length without re-measuring the buffer.
  size: number | undefined;
};

export const createApp = async () => {
  console.log("\n  ➜ Loading Assets");

  // Read the client index.html that includes <!--app-head--> and <!--app-html-->
  // placeholders used for SSR injection.
  const template = await readFile(
    resolve(CWD, `${CLIENT_ASSETS_DIR}/index.html`),
    "utf8",
  );

  // Import the SSR entry produced by Vite's ssr build.
  const { renderToString, renderToStream }: SSRSetup = await import(
    resolve(CWD, "app.js")
  ).then((e) => e.default);

  // Load the Vite manifest
  const manifest = await import(
    resolve(CWD, `${CLIENT_ASSETS_DIR}/.vite/manifest.json`),
    { with: { type: "json" } }
  ).then((e) => e.default);

  // Read all assets into an in-memory cache, optionally with content.
  const assetCache = await loadAssets();

  const app = new Hono({ strict: false });

  const ssrOptions = (): SSROptions => {
    return {
      template,
      manifest,
      assets: [...assetCache.entries()].flatMap(
        ([path, { file, buffer, size }]) => {
          if (file.startsWith(CLIENT_ASSETS_DIR)) {
            return [];
          }

          const kind = path.endsWith(".js")
            ? "js"
            : path.endsWith(".css")
              ? "css"
              : undefined;

          if (!kind) {
            return [];
          }

          const tag =
            kind === "js"
              ? `<script type="module" crossorigin src="${path}"></script>`
              : `<link rel="stylesheet" crossorigin href="${path}" />`;

          return {
            tag,
            kind,
            path,
            content: buffer ? new TextDecoder().decode(buffer) : undefined,
            size,
          };
        },
      ),
    };
  };

  const renderPage = async (url: URL) => {
    const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

    const { head, html } = await renderToString(url, ssrOptions());

    return [
      htmlStart.replace("<!--app-head-->", head ?? ""),
      html ?? "",
      htmlEnd,
    ].join("\n");
  };

  for (const { honoPattern } of Object.values(routeMap)) {
    app.get(join(baseurl, honoPattern), async (ctx) => {
      try {
        const url = new URL(ctx.req.url);

        if (typeof renderToStream === "function") {
          // Mode 1: streaming SSR.
          //
          // - renderToStream is responsible for writing HTML chunks into `response`.
          // - Provided renderer can decide when to:
          //     - start the shell,
          //     - hydrate with client-side routes/assets.
          //
          // This gives frameworks full control for advanced streaming strategies
          // (e.g., suspense boundaries, progressive hydration, selective re-render).
          return stream(ctx, async (stream) => {
            await renderToStream(url, ssrOptions(), stream);
          });
        }

        if (typeof renderToString === "function") {
          // Mode 2: string-based SSR.
          //
          // - renderToString() returns { head, html } for the current route.
          // - Splice that into the Vite-generated index.html template by replacing:
          //   - <!--app-head--> with collected head tags (CSS + optional user head)
          //   - <!--app-html--> with the app HTML markup
          //
          // This mode is simple and works well when you don't need streaming.
          const page = await renderPage(url);
          return ctx.html(page);
        }

        // SSR factory returned neither mode
        ctx.status(501);
        return ctx.html("<h1>501: Not Implemented</h1>");
      } catch (error: any) {
        // Handle thrown Response instances as redirects.
        // Re-throw other errors for upstream handling.
        if (error instanceof Response) {
          const Location = error.headers.get("Location");

          if (!Location || !REDIRECT_CODES.includes(error.status)) {
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
    // If incoming request path matches something cached at startup, serve it directly.
    // This covers JS, CSS, images, fonts, etc., including their .map siblings.
    const asset = assetCache.get(ctx.req.path);

    if (asset) {
      return asset.buffer
        ? new Response(asset.buffer as never, {
            headers: {
              "Content-Type": asset.contentType,
              "Content-Length": String(asset.size),
            },
          })
        : ctx.notFound();
    }

    if (typeof renderToString === "function") {
      const url = new URL(ctx.req.url);
      const page = await renderPage(url);
      ctx.status(404);
      return ctx.html(page);
    }

    return ctx.notFound();
  });

  return app;
};

/**
 * Build an in-memory asset graph,
 * optionally loading asset content into memory,
 * depending on deployment mode.
 *
 * The asset graph always includes every built asset URL so the SSR server
 * can correctly recognize static asset requests
 * and return 404 when `serveStaticAssets` explicitly set to false.
 *
 * Behavior depends on `serveStaticAssets` option:
 *
 *   when true (default)
 *     → All assets produced by the build (JS, CSS, images, fonts, etc.)
 *       are read into memory as Buffers at server startup.
 *     → The SSR server is fully responsible for serving static assets.
 *
 *   when false
 *     → Asset URLs are still registered in the cache,
 *       but with *no* Buffer content.
 *     → Browser requests to those asset URLs will return `404` when hitting SSR server.
 *
 * Set `serveStaticAssets` to false when a reverse proxy or CDN is expected to serve static assets.
 * */
export const loadAssets = async () => {
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

  const files = await glob(
    [CLIENT_ASSETS_DIR, SERVER_ASSETS_DIR].map((e) => `${e}/assets/**`),
    {
      cwd: CWD,
      onlyFiles: true,
      absolute: false,
    },
  );

  for (const file of files) {
    const path = resolve(CWD, file);

    const buffer = SERVE_STATIC_ASSETS
      ? new Uint8Array(await readFile(path))
      : undefined;

    const key = resolve(
      baseurl,
      file.startsWith(CLIENT_ASSETS_DIR)
        ? file.replace(CLIENT_ASSETS_DIR, "")
        : file,
    );

    assetCache.set(key, {
      file,
      buffer,
      contentType: contentTypeResolver(path),
      size: buffer?.length,
    });
  }

  return assetCache;
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

  if (![sock, port].some(Boolean)) {
    console.error(
      styleText("red", "✗ Please provide either -p/--port or -s/--sock"),
    );
    process.exit(1);
  }

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

  const app = await createApp();

  console.log(
    `\n  ➜ Starting Server ${styleText(["dim"], "[ %s ]")}`,
    sock ? `sock: ${sock}` : `port: ${port}`,
  );

  const onListen = async () => {
    if (sock) {
      // Make Unix socket world-writable so other processes (e.g. a reverse proxy)
      // can connect without permission issues.
      await chmod(sock, 0o777);
    }
    console.log("\n  ➜ Server Started ✨");
  };

  if (typeof Bun !== "undefined") {
    Bun.serve(
      sock
        ? { unix: sock, fetch: app.fetch }
        : { port: Number(port), fetch: app.fetch },
    );
    await onListen();
  } else if (typeof Deno !== "undefined") {
    sock
      ? Deno.serve({ path: sock, onListen }, app.fetch)
      : Deno.serve({ port: Number(port), onListen }, app.fetch);
  } else {
    const server = createAdaptorServer(app);
    server.listen(sock || port, onListen);
  }
}
