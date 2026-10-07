import net from "node:net";

/**
 * Probe whether a single TCP port is free on given host.
 *
 * Resolves `true` only after the probe server has fully closed,
 * so the caller can immediately rebind without racing the OS.
 * `unref()` keeps a dangling probe from holding the event loop open.
 * */
export const isPortFree = (host: string, port: number, timeoutMs = 2000) => {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    const done = (result: boolean) => {
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      server.close(() => done(false));
    }, timeoutMs);

    server.unref();
    server.once("error", () => done(false));
    server.once("listening", () => server.close(() => done(true)));

    server.listen({ host, port });
  });
};

/**
 * Find `count` consecutive free ports by probing random offsets within minPort..maxPort.
 * Each attempt picks a uniformly random start, probes the whole window,
 * and returns it only if every port is free.
 * Failed attempts are cheap because only the window is probed - no full-range scan.
 * */
export const findFreePortRange = async (
  host: string,
  count: number,
  {
    minPort = 20_000,
    maxPort = 29_000,
    attempts = 32,
  }: {
    minPort?: number;
    maxPort?: number;
    attempts?: number;
  } = {},
): Promise<Array<number>> => {
  if (count < 1) {
    throw new Error("count must be >= 1");
  }

  const span = maxPort - minPort - count + 1;

  if (span <= 0) {
    throw new Error(
      `Port range ${minPort}-${maxPort} is too small for a window of ${count}`,
    );
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    const start = minPort + Math.floor(Math.random() * span);
    const range = Array.from({ length: count }, (_, i) => start + i);

    const results = await Promise.all(range.map((p) => isPortFree(host, p)));

    if (results.every(Boolean)) {
      return range;
    }
  }

  throw new Error(
    `No run of ${count} free ports found in range ${minPort}-${maxPort} after ${attempts} random attempts`,
  );
};
