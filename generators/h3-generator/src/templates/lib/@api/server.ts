import type { IncomingMessage, ServerResponse } from "node:http";
import { parseArgs, styleText } from "node:util";

import { serve as h3serve } from "h3";
import { toNodeHandler } from "h3/node";

import type { App } from "./app";

export type NodeListener = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Wrap the app into a node:http request listener.
 * Used by dist/run.js to mount this folder's API next to other folders;
 * the standalone server (`serve`) binds the app through h3's own adapter instead.
 * */
export const createListener = <T extends App>(app: T): NodeListener => {
  return toNodeHandler(app);
};

type Handles = {
  port?: number | undefined;
  onListen?: () => Promise<void>;
};

const getListenHandles = async (opt?: Handles) => {
  const { port } = opt
    ? opt
    : parseArgs({
        options: {
          port: {
            type: "string",
            short: "p",
          },
        },
      }).values;

  if (![port].some(Boolean)) {
    throw new Error("Please provide -p/--port number");
  }

  const onListen = async () => {
    console.log(
      `\n  ✨ Server Started ${styleText(["dim"], "[ %s ]")}`,
      `port: ${port}`,
    );
  };

  return {
    port: Number(port),
    onListen: opt?.onListen || onListen,
  };
};

export const serve = async <T extends App>(app: T, opt?: Handles) => {
  const { port, onListen } = await getListenHandles(opt);

  const server = h3serve(app, { port });
  await server.ready().then(onListen);

  return server as never;
};
