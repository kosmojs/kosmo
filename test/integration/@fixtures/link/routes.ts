import { routes as genericRoutes } from "../generic/routes";

export type LinkRoute = {
  name: string;
  // keyed in route param order; converted to the Link tuple by the factory
  params: Record<string, string | ReadonlyArray<string>>;
  query?: Record<string, string>;
  // data-testid of the rendered anchor
  id: string;
  // expected path relative to the folder base, "/" for the folder root
  href: string;
  label: string;
};

export const routes: ReadonlyArray<LinkRoute> = [
  ...genericRoutes,

  // Index page: the pattern compiles to "", so join(base, "") must yield the base itself,
  // not "" (a link to the current page) and not base twice
  {
    name: "index",
    params: {},
    id: "link-index",
    href: "/",
    label: "Home",
  },

  // Root-level optional: the pattern starts with "{/:locale}",
  // so join(base, pattern) compiles to "//en" once the param is set unless parametrize() normalizes
  {
    name: "{locale}",
    params: {},
    id: "link-locale-empty",
    href: "/",
    label: "Default Locale",
  },
  {
    name: "{locale}",
    params: { locale: "en" },
    id: "link-locale-en",
    href: "/en",
    label: "English",
  },

  // Root-level splat: same "{/*rest}" shape as the optional above
  {
    name: "{...rest}",
    params: { rest: ["guides", "intro"] },
    id: "link-rest",
    href: "/guides/intro",
    label: "Rest",
  },

  // Query string appended by path();
  // on the index page the base must stay intact in front of it
  {
    name: "about",
    params: {},
    query: { tab: "team", page: "2" },
    id: "link-about-query",
    href: "/about",
    label: "About Team",
  },
  {
    name: "index",
    params: {},
    query: { ref: "footer" },
    id: "link-index-query",
    href: "/",
    label: "Home Ref",
  },
];
