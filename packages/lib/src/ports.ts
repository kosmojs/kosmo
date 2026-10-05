import net from "node:net";

/**
 * Probe whether a single TCP port is free on 127.0.0.1.
 *
 * Resolves `true` only after the probe server has fully closed,
 * so the caller can immediately rebind without racing the OS.
 * `unref()` keeps a dangling probe from holding the event loop open.
 * */
export const isPortFree = (port: number, timeoutMs = 2000) => {
  return new Promise((resolve) => {
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

    server.listen(port, "127.0.0.1");
  });
};

/**
 * Find `count` consecutive free ports in the derived range.
 *
 * Returns the full array, e.g. [3123, 3124, 3125, 3126].
 * Scans windows linearly from `minPort`; ports known to be taken are cached
 * so a failed window only probes genuinely new candidates on the next iteration.
 * */
export const findFreePortRange = async (
  devPort: number,
  count: number,
): Promise<Array<number>> => {
  if (count < 1) {
    throw new Error("count must be >= 1");
  }

  const { minPort, maxPort } = derivePortRange(devPort);
  const taken = new Set<number>();

  for (let start = minPort; start + count - 1 <= maxPort; start++) {
    if (taken.has(start)) {
      continue;
    }

    const window = Array.from({ length: count }, (_, i) => start + i);
    const results = await Promise.all(window.map((p) => isPortFree(p)));

    for (const [i, isFree] of results.entries()) {
      isFree || taken.add(window[i]);
    }

    if (results.every(Boolean)) {
      return window;
    }
  }

  throw new Error(
    `No run of ${count} free ports found in range ${minPort}-${maxPort}`,
  );
};

const derivePortRange = (
  port: number,
): { minPort: number; maxPort: number } => {
  const BASE = 20_000;
  const SPAN = 20;

  const offset = (port % 100) * SPAN;
  const minPort = BASE + offset;
  const maxPort = minPort + SPAN - 1;

  if (maxPort > 29_999) {
    throw new Error(`${port} port maps outside the 20000–29999 window`);
  }

  return { minPort, maxPort };
};
