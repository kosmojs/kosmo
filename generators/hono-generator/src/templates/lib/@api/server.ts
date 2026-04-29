import { chmod, unlink } from "node:fs/promises";
import { parseArgs, styleText } from "node:util";

import { createAdaptorServer } from "@hono/node-server";

import type { ServerFactory } from "@kosmojs/core/api";

import type { App } from "./app";

export const serverFactory: ServerFactory<App> = (factory) => {
  const { values } = parseArgs({
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

  const getListenHandles = async () => {
    const { port, sock } = { ...values };

    if (![port, sock].some(Boolean)) {
      console.error("Please provide either -p/--port number or -s/--sock path");
      process.exit(1);
    }

    if (sock) {
      await unlink(sock).catch((error) => {
        if (error.code === "ENOENT") {
          return;
        }
        console.error(error.message);
        process.exit(1);
      });
    }

    return { port, sock };
  };

  const onListen = async () => {
    const { port, sock } = await getListenHandles();
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

  return factory({
    async createServer(app) {
      const { port, sock } = await getListenHandles();

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
    },
    getListenHandles,
    onListen,
  });
};

process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION - This is likely caused by:");
  console.error("   - Middleware not awaiting next()");
  console.error("   - Middleware not returning next()");
  console.error("");
  console.error("Reason:", reason);
  console.error("");
  // In development, crash hard
  if (process.env.NODE_ENV === "development") {
    process.exit(1);
  }
});
