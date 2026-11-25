import { access, chmod, constants, readFile, unlink } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, styleText } from "node:util";

import { getRequestListener } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { StreamingApi } from "hono/utils/stream";
import { glob } from "tinyglobby";

import {
  compileAliasPatterns,
  type FetchApp,
  MIME_TYPES,
  matchBase,
  type NodeApp,
  type SSRSetup,
} from "@kosmojs/core";

import { routeMap } from "{{ createImport 'lib' '@ssr/routes' }}";
import {
  backendAliasPatterns,
  backendBase,
  base,
} from "{{ createImport 'libCore' }}";
import { redirectCodes, ssrOrigin } from "{{ createImport 'libCore' 'ssr' }}";

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
  // Cache-Control header - hashed assets are immutable, public/ files are not.
  cacheControl: string;
};

export const createApp = async (
  errorHandler?: (error: Error & { url: string }) => void | undefined,
) => {
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

  const { renderToString, renderToStream, onError } = ssrApp;

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

  const handleError = (url: string, error: Error, fallback: Function) => {
    // assign, not spread: message and stack are non-enumerable on Error,
    // a spread silently drops them
    Object.assign(error, { url });
    if (onError) {
      onError(error as never);
    } else {
      fallback();
    }
    errorHandler?.(error as never);
  };

  /**
   * A redirect reaches the server as a thrown Response:
   * React Router throws one for `redirect()`, the solid and vue integrations throw one
   * for a redirect their router made, and a loader may throw one itself.
   * Turned into the redirect here, as long as it carries one;
   * any other Response thrown is a bug in the app, not a page to render.
   * */
  const respondWithRedirect = (ctx: Context, response: Response) => {
    const location = response.headers.get("Location");
    if (!location || !redirectCodes.includes(response.status)) {
      ctx.status(500);
      return ctx.html("<h1>500: Malformed redirect</h1>");
    }
    return ctx.redirect(location, response.status as never);
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

  /**
   * The client shell, served verbatim when the server render failed:
   * the client renders the page itself, and its error boundaries handle the error uniformly.
   * */
  const csrFallback = (ctx: Context, error: unknown) => {
    const errorMessage = "WARN: SSR failed, fallback to CSR";
    handleError(ctx.req.url, error as never, () => {
      console.error(errorMessage);
      console.error(error);
      console.error();
    });
    return [
      injectHead(
        htmlStart,
        `<script>console.error("${errorMessage}")</script>`,
      ),
      htmlEnd,
    ].join("");
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
          // a redirect is not a render failure: there is nothing to fall back from
          if (error instanceof Response) {
            throw error;
          }
          return { error };
        }
      },
    );

    if (error) {
      return csrFallback(ctx, error);
    }

    return [injectHead(htmlStart, head), html ?? "", htmlEnd].join("");
  };

  const app = new Hono({ strict: false });

  // Static files win over routes, as they do in vite dev and behind a reverse proxy.
  // This covers hashed assets/ (JS, CSS, images, fonts, .map siblings) and public/ files.
  app.use(async (ctx, next) => {
    if (!["GET", "HEAD"].includes(ctx.req.method)) {
      return next();
    }

    const asset = assets.get(ctx.req.path);

    if (!asset) {
      return next();
    }

    return new Response(
      ctx.req.method === "HEAD" ? null : (asset.buffer as never),
      {
        headers: {
          "Content-Type": asset.contentType,
          "Content-Length": String(asset.size),
          "Cache-Control": asset.cacheControl,
        },
      },
    );
  });

  for (const { pathPattern, renderMode } of routeMap) {
    app.get(join(base, pathPattern), async (ctx) => {
      try {
        const url = new URL(ctx.req.url);

        if (renderMode === "string" && typeof renderToString === "function") {
          const page = await renderPage(url, ctx);
          return ctx.html(page);
        }

        if (renderMode === "stream" && typeof renderToStream === "function") {
          const { readable, writable } = new TransformStream();
          const stream = new StreamingApi(writable, readable);

          /**
           * The request store: a fetch failing during the render records its error here.
           * Read from the object itself, the stream outlives the store's async context.
           * */
          const context: {
            headers: Record<string, string>;
            url: string;
            error?: unknown;
          } = {
            headers: Object.fromEntries(ctx.req.raw.headers),
            url: ctx.req.url,
          };

          /**
           * Rendered up to the shell before the response starts, while its status can still change:
           * - a redirect thrown while the route resolves reaches the catch below as a redirect;
           * - a failure before the shell (a render error, a loader's fetch error)
           * gets the CSR fallback, the same as string mode.
           * */
          let rendered: { head?: string; html: ReadableStream };

          try {
            rendered = await withSsrContext(context, () => {
              return renderToStream(url, ssrOptions(), stream as never);
            });
          } catch (error) {
            if (error instanceof Response) {
              throw error;
            }
            return ctx.html(csrFallback(ctx, error));
          }

          if (context.error) {
            // nothing written yet, so the render is dropped rather than streamed
            await rendered.html.cancel().catch(() => {});
            return ctx.html(csrFallback(ctx, context.error));
          }

          ctx.header("Content-Type", "text/html");

          /**
           * From here on the response has started:
           * a failure while streaming (a pipe that rejects, a fetch failing past the shell)
           * can only be reported, the response cannot be replaced.
           * Error handling past the shell is the route's own.
           * */
          void (async () => {
            let error: unknown;

            try {
              const { head = "", html } = rendered;
              await stream.write(injectHead(htmlStart, head));
              await stream.pipe(html);
              await stream.write(htmlEnd);
            } catch (e) {
              error = e;
            } finally {
              await stream.close();
            }

            error ??= context.error;

            if (error) {
              handleError(ctx.req.url, error as never, () => {
                console.error("ERROR: SSR stream render failed");
                console.error(error);
                console.error();
              });
            }
          })();

          return ctx.newResponse(stream.responseReadable);
        }

        ctx.status(501);
        return ctx.html("<h1>501: Not Implemented</h1>");
      } catch (error: any) {
        // a thrown Response is a redirect; other errors go upstream
        if (error instanceof Response) {
          return respondWithRedirect(ctx, error);
        }
        throw new HTTPException(500, { message: error.message, cause: error });
      }
    });
  }

  app.get("/*", async (ctx) => {
    // render 404 page
    if (typeof renderToString === "function") {
      const url = new URL(ctx.req.url);
      try {
        const page = await renderPage(url, ctx);
        ctx.status(404);
        return ctx.html(page);
      } catch (error) {
        if (error instanceof Response) {
          return respondWithRedirect(ctx, error);
        }
        throw error;
      }
    }

    return ctx.notFound();
  });

  return app;
};

/**
 * Build an in-memory asset graph, loading asset content into memory.
 * The asset graph always includes every built asset URL so the SSR server
 * can correctly recognize static asset requests.
 *
 * Two roots, each directory being its own allowlist - nothing else in the bundle root is served:
 *   - assets/ - emitted by vite with content hashes, served at base/assets/, cacheable forever
 *   - public/ - copied verbatim from the folder's public dir, served at base/, names are stable so clients must revalidate
 * */
const loadAssets = async (root: string) => {
  // Resolve HTTP Content-Type from the asset's file extension.
  const contentTypeResolver = (filePath: string) => {
    const ext = extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || "application/octet-stream";
  };

  // Map from URL path (as used in requests) to asset metadata.
  const assetCache = new Map<string, AssetInfo>();

  const roots = [
    {
      folder: "assets",
      prefix: join(base, "assets"),
      cacheControl: "public, max-age=31536000, immutable",
    },
    {
      folder: "public",
      prefix: base,
      cacheControl: "no-cache",
    },
  ];

  for (const { folder, prefix, cacheControl } of roots) {
    const cwd = resolve(root, folder);

    const readable = await access(cwd, constants.F_OK).then(
      () => true,
      () => false,
    );

    if (!readable) {
      continue;
    }

    const files = await glob("**", {
      cwd,
      onlyFiles: true,
      absolute: false,
    });

    for (const file of files) {
      const buffer = new Uint8Array(await readFile(resolve(cwd, file)));
      assetCache.set(join(prefix, file), {
        file,
        buffer,
        contentType: contentTypeResolver(file),
        size: buffer.length,
        cacheControl,
      });
    }
  }

  return assetCache;
};

type NodeListener = (req: IncomingMessage, res: ServerResponse) => void;

const createNodeListener = (app: FetchApp | NodeApp): NodeListener => {
  return typeof (app as FetchApp).fetch === "function"
    ? getRequestListener((app as FetchApp).fetch)
    : (app as NodeApp).callback();
};

/**
 * The folder's complete request surface as a single node:http listener:
 * API requests under `backend.base` and ones in `backend.alias` go to the bundled backend,
 * everything else to the SSR app.
 * `startServer` binds it to a port/socket; `dist/run.js` mounts it next to other folders.
 * */
export const createListener = async (): Promise<NodeListener> => {
  const {
    backendApp,
  }: {
    backendApp: FetchApp | NodeApp;
  } = await import(`${ROOT}/app.js`);

  const ssrApp = await createApp();

  const ssrListener = createNodeListener(ssrApp as never);

  const backendListener = backendApp
    ? createNodeListener(backendApp as never)
    : undefined;

  const aliasPatterns = compileAliasPatterns(backendAliasPatterns);

  return (req, res) => {
    if (!backendListener) {
      return ssrListener(req, res);
    }
    const path = new URL(req.url ?? "/", ssrOrigin).pathname;
    return aliasPatterns.some((regexp) => regexp.test(path)) ||
      matchBase(backendBase, path)
      ? backendListener(req, res)
      : ssrListener(req, res);
  };
};

export const startServer = async ({
  host,
  sock,
  port,
}: {
  host?: string | undefined;
  sock?: string | undefined;
  port?: string | number | undefined;
}) => {
  if (![sock, port].some(Boolean)) {
    throw new Error("Please provide either -p/--port or -s/--sock");
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

  console.log(
    `\n  ➜ Starting SSR Server ${styleText(["dim"], "[ %s ]")}`,
    sock ? sock : `${host || ""}:${port}`,
  );

  const server = createServer(await createListener());

  server.listen(
    {
      ...(host ? { host } : {}),
      ...(port ? { port } : {}),
      ...(sock ? { path: sock } : {}),
    },
    () => {
      if (sock) {
        // Make Unix socket world-writable so other processes (e.g. a reverse proxy)
        // can connect without permission issues.
        chmod(sock, 0o777).catch((err) => {
          console.error("Failed to chmod socket:", err);
        });
      }
      console.log("\n  ➜ Server Started ✨");
    },
  );

  return server;
};

const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  /**
   * Parse CLI arguments so this file can be used both as a module
   * and a standalone executable
   * */
  const {
    values: { host, port, sock },
  } = parseArgs({
    options: {
      host: {
        type: "string",
        short: "h",
      },
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
    await startServer({ host, sock, port });
  } catch (error: any) {
    console.error(styleText("red", "✗ Failed starting SSR server"));
    console.error(error);
    process.exit(1);
  }
}
