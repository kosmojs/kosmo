import type { DevEnvironment } from "vite";

/**
 * Runs async steps one at a time, in the order they were asked for.
 *
 * A dev reload is a sequence - tear the running program down, then evaluate the next one -
 * while file events arrive whenever they like, several per save.
 * Started straight from the event, two reloads run side by side:
 * both tear down the same program and both evaluate a new one, only one of which is kept.
 *
 * Everything that replaces the running program goes through one queue:
 * reloads, a server restart, the final teardown.
 * */
export const serialQueue = () => {
  let tail: Promise<unknown> = Promise.resolve();

  // settles as the task does; a task that fails does not hold up the ones behind it
  const run = <T>(task: () => Promise<T> | T): Promise<T> => {
    const result = tail.then(task);
    tail = result.catch(() => {});
    return result;
  };

  /**
   * Wraps a task that has to run once more, however many times it is asked for.
   *
   * While a run is waiting for its turn, asking again changes nothing: that run covers it.
   * Asking after the run started queues another one,
   * as the running one may be past the point where it would have noticed the change.
   * So a burst of events landing mid-run costs one more run, not one each,
   * and the last run always starts after the last event.
   * */
  const coalesce = <T>(task: () => Promise<T> | T) => {
    let waiting: Promise<T> | undefined;
    return (): Promise<T> => {
      waiting ??= run(() => {
        waiting = undefined;
        return task();
      });
      return waiting;
    };
  };

  return { run, coalesce };
};

/**
 * Settles as `task` does, unless it takes longer than `ms` - then rejects with `message`.
 * The task is not cancelled, only no longer waited for.
 * */
export const withDeadline = async <T>(
  task: () => Promise<T> | T,
  ms: number,
  message: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      // called inside a promise, so a task that throws rather than rejects is handled the same
      new Promise<T>((resolve) => resolve(task())),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Transforms every module of the program that starts at `url`, evaluating none of it.
 * Throws where loading the program would: on a module that cannot compile,
 * on an import that cannot be resolved.
 *
 * Meant to run before the running program is torn down.
 * A load that fails partway through leaves the modules ahead of the broken one evaluated:
 * half a program, holding its connections and exporting nothing to close them with.
 *
 * It makes the requests the module runner makes while loading,
 * so whatever is transformed here is cached for the load that follows.
 * Dynamic imports are left out, those are requested when the code around them runs.
 * */
export const linkProgram = async (
  environment: DevEnvironment,
  url: string,
  importer?: string,
  seen = new Set<string>(),
): Promise<void> => {
  const fetched = await environment.fetchModule(url, importer);

  // anything else is externalized, left for node to import
  if ("code" in fetched === false || seen.has(fetched.id)) {
    return;
  }

  seen.add(fetched.id);

  const { deps = [] } = {
    ...environment.moduleGraph.getModuleById(fetched.id)?.transformResult,
  };

  for (const dep of deps) {
    await linkProgram(environment, dep, fetched.file || fetched.id, seen);
  }
};
