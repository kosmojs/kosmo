import { chmod, unlink } from "node:fs/promises";
import { parseArgs, styleText } from "node:util";

import { createAdaptorServer } from "@hono/node-server";

import type { App } from "./app";

type Handles = {
  port?: number | undefined;
  sock?: string | undefined;
  onListen?: () => Promise<void>;
};

const getListenHandles = async (opt?: Handles) => {
  const { port, sock } = opt
    ? opt
    : parseArgs({
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
      }).values;

  if (![port, sock].some(Boolean)) {
    throw new Error("Please provide either -p/--port number or -s/--sock path");
  }

  if (sock) {
    await unlink(sock).catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }

  const onListen = async () => {
    if (sock) {
      // Make Unix socket world-writable so other processes (e.g. a reverse proxy)
      // can connect without permission issues.
      await chmod(sock, 0o777);
    }
    console.log(
      `\n  ✨ Server Started ${styleText(["dim"], "[ %s ]")}`,
      sock ? `sock: ${sock}` : `port: ${port}`,
    );
  };

  return {
    port: Number(port),
    sock,
    onListen: opt?.onListen || onListen,
  };
};

export const serve = async <T extends App>(app: T, opt?: Handles) => {
  const { port, sock, onListen } = await getListenHandles(opt);

  if (typeof Bun !== "undefined") {
    const server = Bun.serve(
      sock
        ? { unix: sock, fetch: app.fetch }
        : { port: Number(port), fetch: app.fetch },
    );
    await onListen();
    return server as never;
  }

  if (typeof Deno !== "undefined") {
    const server = sock
      ? Deno.serve({ path: sock, onListen }, app.fetch)
      : Deno.serve({ port: Number(port), onListen }, app.fetch);
    return server as never;
  }

  const server = createAdaptorServer(app);
  server.listen(sock || port, onListen);

  return server as never;
};
