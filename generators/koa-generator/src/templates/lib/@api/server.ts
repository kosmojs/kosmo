import { chmod, unlink } from "node:fs/promises";
import { parseArgs } from "node:util";

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

  return factory({
    async createServer(app, opt) {
      const { port, sock, callback } = { ...values, ...opt };

      if (![port, sock].some((e) => e)) {
        console.error(
          "Please provide either -p/--port number or -s/--sock path",
        );
        process.exit(1);
      }

      console.log("\n  ➜ Starting Server", { port, sock });

      if (sock) {
        await unlink(sock).catch((error) => {
          if (error.code === "ENOENT") {
            return;
          }
          console.error(error.message);
          process.exit(1);
        });
      }

      const server = app.listen(port || sock, async () => {
        if (sock) {
          await chmod(sock, 0o777);
        }
        await callback?.();
        console.log("\n  ➜ Server Started ✨\n");
      });

      return server as never;
    },
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
