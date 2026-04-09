import { MDXProvider } from "@mdx-js/preact";
import { match, pathToRegexp } from "path-to-regexp";
import { type ComponentType, createContext, h, type VNode } from "preact";

import { baseurl } from "{{ createImport 'config' }}";
import * as NotFound from "{{ createImport 'pages' '404.mdx' }}";

export type RawRoute = {
  name: string;
  pathSegments: number | undefined;
  regexp: RegExp;
  extractParams: (path: string) => Route["params"];
  source: RouteComponent | (() => Promise<RouteComponent>);
  layouts: Array<ComponentType>;
};

type RouteComponent = {
  default: ComponentType;
  frontmatter: Route["frontmatter"];
};

type Route = {
  name: string;
  params: Record<string, string | Array<string>>;
  frontmatter: Record<string, unknown>;
};

export const RouterContext = createContext<Route>({
  name: "",
  params: {},
  frontmatter: {},
});

export const RouterProvider = RouterContext.Provider;

export type RouterInstance = {
  component: VNode<{ value: Route }>;
  frontmatter: Route["frontmatter"];
};

export const createRouter = (
  routes: Array<RawRoute>,
  app: ComponentType,
  opt: { components?: Record<string, ComponentType> },
) => {
  const catchallRoute = createRoute("NotFound", "", NotFound, []);
  return {
    async resolve(url: URL = new URL(window.location.href)) {
      const urlSegments = url.pathname.split("/").filter(Boolean).length;

      // 1: use lightweight `RegExp.test()` on linear scan - no capture allocation
      const matchedRoutes = routes.filter(({ regexp }) => {
        return regexp.test(url.pathname);
      });

      const matchedRoute =
        matchedRoutes.length > 1
          ? matchedRoutes.find(({ pathSegments }) => {
              return pathSegments === undefined || pathSegments === urlSegments;
            })
          : matchedRoutes[0];

      // 2: capture params only on matched route
      const params = matchedRoute
        ? matchedRoute.extractParams(url.pathname)
        : {};

      const route = matchedRoute || catchallRoute;

      const { name, layouts = [] } = route;

      const page =
        typeof route.source === "function"
          ? await route.source()
          : route.source;

      const { frontmatter = {} } = page;

      const content = [app, ...layouts].reduce(
        (children, layout) => h(layout, { frontmatter, children } as never),
        h(page.default, {}),
      );

      return {
        component: h(
          RouterProvider,
          {
            value: {
              name,
              params,
              frontmatter,
            },
          },
          h(MDXProvider, opt, content),
        ),
        frontmatter,
      };
    },
  };
};

export const createRoute = (
  name: string,
  pathPattern: string,
  source: RawRoute["source"],
  layouts: RawRoute["layouts"],
): RawRoute => {
  const path = `${baseurl}/${pathPattern}`.replace(/\/+/g, "/");

  const { regexp } = pathToRegexp(path, { sensitive: true });
  const matcher = match<Route["params"]>(path);

  return {
    name,
    regexp,
    pathSegments: name.includes("...")
      ? undefined
      : name.replace(/^index\/?/, "").split("/").length,
    extractParams: (path) => {
      const match = matcher(path);
      return match ? match.params : {};
    },
    source,
    layouts,
  };
};

export const renderHead = (frontmatter: Route["frontmatter"] | undefined) => {
  const tags: Array<string> = [];

  if (typeof frontmatter?.title === "string") {
    tags.push(`<title>${frontmatter.title}</title>`);
  }

  if (typeof frontmatter?.description === "string") {
    tags.push(`<meta name="description" content="${frontmatter.description}">`);
  }

  if (Array.isArray(frontmatter?.head)) {
    for (const [tag, attrs] of frontmatter.head) {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      tags.push(`<${tag} ${attrStr}>`);
    }
  }

  return tags.join("\n");
};
