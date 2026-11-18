import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createNavigationListener,
  getNavigationScope,
  navigateHref,
  withNavigationScope,
} from "../src/generators/navigation";

const ORIGIN = "https://app.test";

type Intercepted = {
  handler: () => Promise<void>;
  scroll?: string;
};

// a NavigateEvent with every filter passing, overridden per test
const createEvent = (path: string, overrides: Record<string, unknown> = {}) => {
  const controller = new AbortController();
  const event = Object.assign(new Event("navigate"), {
    canIntercept: true,
    hashChange: false,
    downloadRequest: null,
    formData: null,
    navigationType: "push",
    sourceElement: null,
    destination: { url: `${ORIGIN}${path}` },
    signal: controller.signal,
    intercepted: undefined as Intercepted | undefined,
    intercept(options: Intercepted) {
      event.intercepted = options;
    },
    scroll: vi.fn(),
    ...overrides,
  });
  return { event, controller };
};

let navigation: EventTarget & { navigate: ReturnType<typeof vi.fn> };
let location: { reload: ReturnType<typeof vi.fn> } & Record<string, unknown>;

beforeEach(() => {
  navigation = Object.assign(new EventTarget(), { navigate: vi.fn() });
  location = { reload: vi.fn(), assign: vi.fn(), replace: vi.fn() };
  vi.stubGlobal("window", { navigation, location });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const listen = (
  render: (url: URL, signal: AbortSignal) => Promise<void> = async () => {},
) => {
  const rendered: Array<string> = [];
  const stop = createNavigationListener({
    match: (url) => url.pathname.startsWith("/app"),
    async render(url, signal) {
      await render(url, signal);
      rendered.push(url.pathname + url.search);
    },
  });
  const dispatch = (path: string, overrides?: Record<string, unknown>) => {
    const created = createEvent(path, overrides);
    navigation.dispatchEvent(created.event);
    return created;
  };
  return { rendered, stop, dispatch };
};

describe("createNavigationListener", () => {
  test("intercepts a matching navigation, renders, then scrolls", async () => {
    const { rendered, dispatch } = listen();
    const { event } = dispatch("/app/users/1?tab=2");
    expect(event.intercepted?.scroll).toBe("manual");
    await event.intercepted?.handler();
    expect(rendered).toEqual(["/app/users/1?tab=2"]);
    expect(event.scroll).toHaveBeenCalledOnce();
  });

  test("leaves non-matching URLs to the browser", () => {
    const { dispatch } = listen();
    expect(dispatch("/other").event.intercepted).toBeUndefined();
  });

  test.each([
    ["cannot intercept", { canIntercept: false }],
    ["fragment change", { hashChange: true }],
    ["download", { downloadRequest: "file.txt" }],
    ["form submission", { formData: new FormData() }],
    ["reload", { navigationType: "reload" }],
  ])("leaves a %s to the browser", (_, overrides) => {
    const { dispatch } = listen();
    expect(dispatch("/app", overrides).event.intercepted).toBeUndefined();
  });

  test("leaves a link marked data-reload to the browser", () => {
    const { dispatch } = listen();
    const sourceElement = {
      closest: (selector: string) => {
        return selector === "[data-reload]" ? {} : null;
      },
    };
    expect(
      dispatch("/app", { sourceElement }).event.intercepted,
    ).toBeUndefined();
  });

  test("a superseded navigation neither scrolls nor reloads", async () => {
    const { dispatch } = listen(async (_, signal) => {
      await Promise.resolve();
      signal.throwIfAborted();
    });
    const { event, controller } = dispatch("/app/slow");
    const pending = event.intercepted?.handler();
    controller.abort();
    await pending;
    expect(event.scroll).not.toHaveBeenCalled();
    expect(location.reload).not.toHaveBeenCalled();
  });

  test("a failed render reloads, so the server renders the URL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch } = listen(async () => {
      throw new Error("chunk failed to load");
    });
    const { event } = dispatch("/app");
    await event.intercepted?.handler();
    expect(location.reload).toHaveBeenCalledOnce();
    expect(event.scroll).not.toHaveBeenCalled();
  });

  test("the returned function removes the listener", () => {
    const { stop, dispatch } = listen();
    stop();
    expect(dispatch("/app").event.intercepted).toBeUndefined();
  });

  test("without the Navigation API nothing is registered", () => {
    vi.stubGlobal("window", { location });
    expect(() => listen().stop()).not.toThrow();
  });
});

describe("withNavigationScope", () => {
  test("visible synchronously inside the resolver, cleared after", async () => {
    const scope = {
      url: new URL(`${ORIGIN}/app`),
      signal: new AbortController().signal,
    };
    const seen: Array<unknown> = [];
    await withNavigationScope(scope, async () => {
      seen.push(getNavigationScope());
      await Promise.resolve();
      seen.push(getNavigationScope());
    });
    expect(seen).toEqual([scope, undefined]);
    expect(getNavigationScope()).toBeUndefined();
  });

  test("cleared when the resolver throws", () => {
    const scope = {
      url: new URL(`${ORIGIN}/app`),
      signal: new AbortController().signal,
    };
    expect(() => {
      withNavigationScope(scope, () => {
        throw new Error("sync");
      });
    }).toThrow("sync");
    expect(getNavigationScope()).toBeUndefined();
  });
});

describe("navigateHref", () => {
  test("pushes or replaces through the Navigation API", async () => {
    navigation.navigate.mockReturnValue({
      committed: Promise.resolve(),
      finished: Promise.resolve(),
    });
    await navigateHref("/app/a");
    await navigateHref("/app/b", { replace: true });
    expect(navigation.navigate.mock.calls).toEqual([
      ["/app/a", { history: "auto" }],
      ["/app/b", { history: "replace" }],
    ]);
  });

  test("a superseded navigation settles quietly", async () => {
    const abort = () => {
      return Promise.reject(new DOMException("superseded", "AbortError"));
    };
    navigation.navigate.mockReturnValue({
      committed: abort(),
      finished: abort(),
    });
    await expect(navigateHref("/app/a")).resolves.toBeUndefined();
  });

  test("other failures reject", async () => {
    navigation.navigate.mockReturnValue({
      committed: Promise.resolve(),
      finished: Promise.reject(new TypeError("bad")),
    });
    await expect(navigateHref("/app/a")).rejects.toThrow("bad");
  });

  test("falls back to a full page load", () => {
    vi.stubGlobal("window", { location });
    void navigateHref("/app/a");
    void navigateHref("/app/b", { replace: true });
    expect(location.assign).toHaveBeenCalledWith("/app/a");
    expect(location.replace).toHaveBeenCalledWith("/app/b");
  });
});
