/**
 * Attribute that opts a link out of client-side navigation,
 * for a page that must load from the server:
 * `<a href="/report" data-reload>`.
 *
 * Read through `NavigateEvent.sourceElement`;
 * browsers that do not expose it navigate such links client-side.
 * */
export const RELOAD_ATTRIBUTE = "data-reload";

// typed as always present, absent in browsers without the Navigation API
const getNavigation = (): Navigation | undefined => {
  return typeof window === "undefined" ? undefined : window.navigation;
};

export type NavigationListenerOptions = {
  /**
   * Whether the URL belongs to this app - a real route of this source folder,
   * the catch-all excluded. Anything else is left to the browser:
   * another source folder on the same origin is a separate app,
   * and a missing page gets the server's own 404.
   * */
  match: (url: URL) => boolean;
  /**
   * Resolve and render the destination.
   *
   * `signal` aborts once a newer navigation starts - check it after every await
   * and render nothing once aborted, or a slow loader of a superseded navigation
   * overwrites the page the user moved on to.
   * The returned promise must settle only after the DOM shows the new page,
   * as scroll position is applied right after it.
   * */
  render: (url: URL, signal: AbortSignal) => Promise<void>;
};

export type NavigationListener = () => void;

/**
 * Client-side navigation on top of the Navigation API.
 *
 * One `navigate` listener covers link clicks, back and forward, `location.assign()`,
 * `navigation.navigate()` and GET form submissions - links stay plain anchors.
 *
 * Left to the browser:
 * - navigations that cannot be intercepted (cross-origin, cross-document traversals);
 * - fragment-only changes, downloads, POST forms and reloads;
 * - URLs `match` rejects, and links carrying `data-reload`.
 *
 * Without the Navigation API nothing is intercepted
 * and every link stays a full page load, served by SSR or the CSR shell.
 *
 * Returns a function that removes the listener.
 * */
export const createNavigationListener = ({
  match,
  render,
}: NavigationListenerOptions): NavigationListener => {
  const navigation = getNavigation();

  if (!navigation) {
    return () => {};
  }

  const onNavigate = (event: NavigateEvent) => {
    if (
      !event.canIntercept ||
      event.hashChange ||
      event.downloadRequest !== null ||
      event.formData ||
      event.navigationType === "reload"
    ) {
      return;
    }

    if (event.sourceElement?.closest(`[${RELOAD_ATTRIBUTE}]`)) {
      return;
    }

    const url = new URL(event.destination.url);

    if (!match(url)) {
      return;
    }

    event.intercept({
      // scrolled once the new page is in the DOM, not when the URL commits;
      // push and replace go to the top or the fragment, traversals restore the position
      scroll: "manual",
      async handler() {
        try {
          await render(url, event.signal);
        } catch (error) {
          if (event.signal.aborted) {
            return;
          }
          // the URL is already committed - let the server render it
          console.error(error);
          window.location.reload();
          return;
        }
        if (!event.signal.aborted) {
          event.scroll();
        }
      },
    });
  };

  navigation.addEventListener("navigate", onNavigate);

  return () => {
    navigation.removeEventListener("navigate", onNavigate);
  };
};

export type NavigationScope = { url: URL; signal: AbortSignal };

let navigationScope: NavigationScope | undefined;

/**
 * Run a resolver within the URL and abort signal of a client-side navigation.
 *
 * The resolver is the seeded `clientRouter()`, which takes no arguments,
 * so the navigation is handed over through module scope instead:
 * the router reads it with `getNavigationScope()` synchronously,
 * before its first await, and the scope is cleared
 * as soon as the resolver returns its promise.
 * A resolver that awaits before resolving gets no scope -
 * no signal, and the URL from `window.location`, already committed by then.
 * */
export const withNavigationScope = <T>(
  scope: NavigationScope,
  resolver: () => T,
): T => {
  navigationScope = scope;
  try {
    return resolver();
  } finally {
    navigationScope = undefined;
  }
};

export const getNavigationScope = (): NavigationScope | undefined => {
  return navigationScope;
};

/**
 * Navigate to an href the way a link click would,
 * so it goes through the listener above when the destination matches.
 *
 * Settles once the destination is rendered.
 * A navigation superseded by a newer one settles quietly instead of rejecting.
 * Without the Navigation API this is a full page load and never settles.
 * */
export const navigateHref = (
  href: string,
  { replace }: { replace?: boolean | undefined } = {},
): Promise<void> => {
  const navigation = getNavigation();

  if (!navigation) {
    if (replace) {
      window.location.replace(href);
    } else {
      window.location.assign(href);
    }
    return new Promise(() => {});
  }

  const { committed, finished } = navigation.navigate(href, {
    history: replace ? "replace" : "auto",
  });

  // rejects along with `finished`, which is handled below
  committed?.catch(() => {});

  return Promise.resolve(finished).then(
    () => {},
    (error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      throw error;
    },
  );
};
