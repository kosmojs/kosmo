#!/usr/bin/env node

/**
 * Serves every built source folder from a single process.
 *
 * Written by `kosmo build` into the dist directory; `kosmo preview` restarts it after each rebuild.
 *
 *   node dist/run.js -p 4556
 *   node dist/run.js -s /tmp/app.sock
 *
 * Folders are discovered at startup from `dist/<folder>/kosmo.json`,
 * so a partial build (`kosmo build admin`) never leaves a stale folder table behind,
 * and removing a folder's dist directory is enough to stop serving it.
 *
 * Per folder:
 *   - SSR folders mount `ssr/server.js` - one listener for pages, assets and the bundled API.
 *   - CSR folders mount `api/listener.js` for the API and serve `client/` statically from memory,
 *     with the SPA fallback to index.html for unmatched page URLs.
 *
 * Authored as TypeScript, deployed with types stripped;
 * only node builtins are used here: `node:http` runs unchanged on Node, Bun and Deno.
 * */

import { chmod, readdir, readFile, unlink } from "node:fs/promises";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { extname, join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { MIME_TYPES, type SourceFolderManifest } from "@kosmojs/core";

type NodeListener = (req: IncomingMessage, res: ServerResponse) => void;

type Folder = SourceFolderManifest & {
  dir: string;
};

type Handler = {
  name: string;
  path: string;
  listener: NodeListener;
};

type StaticFile = {
  buffer: Buffer;
  headers: Record<string, string>;
};

const ROOT = import.meta.dirname;

const contentTypeFor = (file: string): string => {
  return MIME_TYPES[extname(file).toLowerCase()] || "application/octet-stream";
};

const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\/+$/, "");
};

// matches `prefix` itself and anything nested under it, never a sibling sharing the text
const prefixMatcher = (prefix: string): ((pathname: string) => boolean) => {
  const pattern = new RegExp(`^${escapeRegex(prefix)}(?=$|/)`);
  return (pathname) => pattern.test(pathname);
};

const handlerWeight = ({ path }: Handler): number => {
  return path.length + path.split("/").filter(Boolean).length;
};

const readFolders = async (): Promise<Array<Folder>> => {
  const folders: Array<Folder> = [];

  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = join(ROOT, entry.name);

    const manifest = await readFile(join(dir, "kosmo.json"), "utf8").catch(
      () => undefined,
    );

    if (manifest) {
      folders.push({ dir, ...(JSON.parse(manifest) as SourceFolderManifest) });
    }
  }

  return folders;
};

/**
 * In-memory static server for a CSR folder's `client/` output.
 * Everything is read once at startup; Vite hashes the files under `assets/`,
 * so those are served as immutable, the rest as revalidate-always.
 * */
const createStaticListener = async (
  dir: string,
  base: string,
): Promise<NodeListener> => {
  const files = new Map<string, StaticFile>();

  const walk = async (path: string, prefix: string) => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      // Vite's build manifest is not a public file
      if (entry.name === ".vite") {
        continue;
      }

      const file = join(path, entry.name);
      const url = posix.join(prefix, entry.name);

      if (entry.isDirectory()) {
        await walk(file, url);
        continue;
      }

      const buffer = await readFile(file);

      files.set(url, {
        buffer,
        headers: {
          "Content-Type": contentTypeFor(entry.name),
          "Content-Length": String(buffer.length),
          "Cache-Control": url.startsWith(posix.join(base, "assets/"))
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        },
      });
    }
  };

  await walk(dir, base);

  const index = files.get(posix.join(base, "index.html"));

  return (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");

    if (!["GET", "HEAD"].includes(req.method ?? "")) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }

    // a real file wins; anything else is a client route, resolved by the client router
    const file = files.get(pathname) || index;

    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404: Not Found");
      return;
    }

    res.writeHead(200, file.headers);
    res.end(req.method === "HEAD" ? undefined : file.buffer);
  };
};

const mountFolders = async (folders: Array<Folder>) => {
  const handlers: Array<Handler> = [];

  for (const { dir, name, frontend, backend, ssr } of folders) {
    if (ssr) {
      // ssr/server.js bundles the backend
      const { createListener } = (await import(
        resolve(dir, "ssr", "server.js")
      )) as { createListener: () => Promise<NodeListener> };

      const listener = await createListener();

      handlers.push({ name, path: backend?.base as string, listener });
      handlers.push({ name, path: frontend?.base as string, listener });

      continue;
    }

    if (backend) {
      const { default: listener } = (await import(
        pathToFileURL(join(dir, "api", "listener.js")).href
      )) as { default: NodeListener };
      handlers.push({ name, path: backend.base, listener });
    }

    if (frontend) {
      const listener = await createStaticListener(
        join(dir, "client"),
        frontend.base,
      );
      handlers.push({ name, path: frontend.base, listener });
    }
  }

  return handlers
    .sort((a, b) => handlerWeight(b) - handlerWeight(a))
    .map(({ name, path, listener }) => {
      return {
        name,
        prefix: path,
        match: prefixMatcher(path),
        listener,
      };
    });
};

export const createListener = async (): Promise<NodeListener> => {
  const folders = await readFolders();

  if (!folders.length) {
    throw new Error(`No built source folders found in ${ROOT}`);
  }

  const handlers = await mountFolders(folders);

  for (const { name, prefix } of handlers) {
    console.log(`  ${prefix.padEnd(24)} -> ${name}`);
  }

  return (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");

    for (const { match, listener } of handlers) {
      if (match(pathname)) {
        listener(req, res);
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404: Not Found</h1>");
  };
};

export const startServer = async ({
  port,
  sock,
}: {
  port?: string | number | undefined;
  sock?: string | undefined;
}): Promise<Server> => {
  if (![port, sock].some(Boolean)) {
    throw new Error("Please provide either -p/--port or -s/--sock");
  }

  if (sock) {
    await unlink(sock).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    });
  }

  console.log(
    `\n  -> Starting server [ ${sock ? `sock: ${sock}` : `port: ${port}`} ]\n`,
  );

  const server = createServer(await createListener());

  server.listen(sock || Number(port), async () => {
    if (sock) {
      // let a reverse proxy running as another user connect
      await chmod(sock, 0o777);
    }
    console.log("\n  -> Server Started\n");
  });

  return server;
};

if (pathToFileURL(process.argv[1] || "").href === import.meta.url) {
  const {
    values: { port, sock },
  } = parseArgs({
    options: {
      port: { type: "string", short: "p" },
      sock: { type: "string", short: "s" },
    },
  });

  try {
    await startServer({ port, sock });
  } catch (error) {
    console.error("Failed starting server");
    console.error(error);
    process.exit(1);
  }
}
