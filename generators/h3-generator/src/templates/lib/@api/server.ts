import { parseArgs, styleText } from "node:util";

import { serve as h3serve } from "h3";

import type { App } from "./app";

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
