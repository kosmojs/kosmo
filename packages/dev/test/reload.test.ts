import type { DevEnvironment } from "vite";
import { describe, expect, test } from "vitest";

import { linkProgram, serialQueue, withDeadline } from "../src/reload";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// a promise settled from the outside, to hold a task open for as long as a test needs
const gate = () => {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
};

describe("serialQueue", () => {
  test("runs tasks one at a time, in the order they were asked for", async () => {
    const { run } = serialQueue();
    const log: Array<string> = [];

    const task = (name: string, ms: number) => async () => {
      log.push(`start:${name}`);
      await sleep(ms);
      log.push(`end:${name}`);
    };

    // the slowest goes first; started side by side they would finish in reverse
    await Promise.all([
      run(task("a", 30)),
      run(task("b", 10)),
      run(task("c", 0)),
    ]);

    expect(log).toEqual([
      "start:a",
      "end:a",
      "start:b",
      "end:b",
      "start:c",
      "end:c",
    ]);
  });

  test("a task that fails rejects its own promise and nothing else", async () => {
    const { run } = serialQueue();

    const failed = run(async () => {
      throw new Error("boom");
    });
    const next = run(async () => "next");

    await expect(failed).rejects.toThrow("boom");
    await expect(next).resolves.toEqual("next");
  });

  test("a task that throws rather than rejects is handled the same", async () => {
    const { run } = serialQueue();

    const failed = run(() => {
      throw new Error("sync boom");
    });

    await expect(failed).rejects.toThrow("sync boom");
    await expect(run(() => "next")).resolves.toEqual("next");
  });
});

describe("serialQueue: coalesce", () => {
  test("requests made while a run is waiting are covered by that run", async () => {
    const { run, coalesce } = serialQueue();
    const busy = gate();
    let runs = 0;

    const reload = coalesce(async () => {
      runs += 1;
    });

    // something else holds the queue, so the reload has to wait for its turn
    const blocker = run(() => busy.promise);

    const requests = [reload(), reload(), reload()];
    expect(new Set(requests).size).toEqual(1);

    busy.open();
    await Promise.all([blocker, ...requests]);

    expect(runs).toEqual(1);
  });

  test("a request made after the run started queues one more run", async () => {
    const { coalesce } = serialQueue();
    const first = gate();
    const log: Array<string> = [];
    let runs = 0;

    const reload = coalesce(async () => {
      runs += 1;
      const n = runs;
      log.push(`start:${n}`);
      if (n === 1) {
        await first.promise;
      }
      log.push(`end:${n}`);
    });

    const running = reload();
    // let it start
    await sleep(0);
    expect(log).toEqual(["start:1"]);

    // a burst landing mid-run: one more run, not three
    const requests = [reload(), reload(), reload()];
    expect(new Set(requests).size).toEqual(1);
    expect(requests[0]).not.toBe(running);

    first.open();
    await Promise.all([running, ...requests]);

    // and it starts only after the first one is over
    expect(log).toEqual(["start:1", "end:1", "start:2", "end:2"]);
  });

  test("a run that fails does not stop the next request", async () => {
    const { coalesce } = serialQueue();
    let runs = 0;

    const reload = coalesce(async () => {
      runs += 1;
      if (runs === 1) {
        throw new Error("boom");
      }
      return runs;
    });

    await expect(reload()).rejects.toThrow("boom");
    await expect(reload()).resolves.toEqual(2);
  });

  test("shares the queue with plain tasks", async () => {
    const { run, coalesce } = serialQueue();
    const log: Array<string> = [];

    const reload = coalesce(async () => {
      log.push("reload:start");
      await sleep(10);
      log.push("reload:end");
    });

    await Promise.all([
      reload(),
      run(async () => {
        log.push("teardown");
      }),
    ]);

    expect(log).toEqual(["reload:start", "reload:end", "teardown"]);
  });
});

describe("withDeadline", () => {
  test("settles as the task does when it is in time", async () => {
    await expect(withDeadline(async () => "done", 50, "late")).resolves.toEqual(
      "done",
    );
    await expect(
      withDeadline(
        async () => {
          throw new Error("boom");
        },
        50,
        "late",
      ),
    ).rejects.toThrow("boom");
  });

  test("accepts a task that is not async", async () => {
    await expect(withDeadline(() => "done", 50, "late")).resolves.toEqual(
      "done",
    );
    await expect(
      withDeadline(
        () => {
          throw new Error("sync boom");
        },
        50,
        "late",
      ),
    ).rejects.toThrow("sync boom");
  });

  test("rejects with the message once the deadline passes", async () => {
    const started = Date.now();

    await expect(
      withDeadline(() => new Promise(() => {}), 30, "still pending"),
    ).rejects.toThrow("still pending");

    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe("linkProgram", () => {
  /**
   * The two things linkProgram asks of an environment, over a program given as
   * `{ url: [deps] }`. A dep that is not a key is external; `broken` urls fail to fetch,
   * the way a module that cannot compile or cannot be found does.
   * */
  const fakeEnvironment = (
    graph: Record<string, Array<string>>,
    broken: Array<string> = [],
  ) => {
    const fetched: Array<string> = [];

    const environment = {
      async fetchModule(url: string, importer?: string) {
        fetched.push(importer ? `${importer} -> ${url}` : url);
        if (broken.includes(url)) {
          throw new Error(`cannot load ${url}`);
        }
        return url in graph
          ? { code: "", file: url, id: url, url, invalidate: false }
          : { externalize: url, type: "module" };
      },
      moduleGraph: {
        getModuleById(id: string) {
          return { transformResult: { code: "", map: null, deps: graph[id] } };
        },
      },
    };

    return { environment: environment as never as DevEnvironment, fetched };
  };

  test("requests every module once per importer, and each module's deps once", async () => {
    const { environment, fetched } = fakeEnvironment({
      "/dev.ts": ["/app.ts", "/db.ts"],
      "/app.ts": ["/db.ts", "pg"],
      "/db.ts": ["pg"],
    });

    await linkProgram(environment, "/dev.ts");

    expect(fetched).toEqual([
      "/dev.ts",
      "/dev.ts -> /app.ts",
      "/app.ts -> /db.ts",
      "/db.ts -> pg",
      "/app.ts -> pg",
      // already walked through /app.ts, so its deps are not requested again
      "/dev.ts -> /db.ts",
    ]);
  });

  test("ends on a program with circular imports", async () => {
    const { environment, fetched } = fakeEnvironment({
      "/a.ts": ["/b.ts"],
      "/b.ts": ["/a.ts"],
    });

    await linkProgram(environment, "/a.ts");

    expect(fetched).toEqual(["/a.ts", "/a.ts -> /b.ts", "/b.ts -> /a.ts"]);
  });

  test("throws where loading would, however deep the module is", async () => {
    const { environment } = fakeEnvironment(
      {
        "/dev.ts": ["/app.ts"],
        "/app.ts": ["/routes.ts"],
        "/routes.ts": ["/users.ts"],
      },
      ["/users.ts"],
    );

    await expect(linkProgram(environment, "/dev.ts")).rejects.toThrow(
      "cannot load /users.ts",
    );
  });

  test("tolerates a module with no deps recorded", async () => {
    const { environment } = fakeEnvironment({ "/dev.ts": undefined as never });

    await expect(linkProgram(environment, "/dev.ts")).resolves.toBeUndefined();
  });
});
