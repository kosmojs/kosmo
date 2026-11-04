import { inject } from "vitest";

import type { PageRouteSerialized } from "@kosmojs/core";
import type { RoutePathMethods } from "@kosmojs/core/generators";

import { name, pageRouteMap } from "{{ createImport 'libCore' }}";

type PageMap = typeof pageRouteMap;

export const prepareHarness = async <R extends keyof PageMap>(route: R) => {
  const base = inject(`KOSMO_TEST_URL:${name}:frontend`);

  const pages: {
    [K in keyof PageMap]: Omit<PageMap[K], "href"> & {
      href: PageMap[K]["path"];
    };
  } = Object.fromEntries(
    Object.entries(
      pageRouteMap as unknown as Record<
        string,
        PageRouteSerialized & RoutePathMethods<[]>
      >,
    ).map(([name, { href, ...page }]) => {
      return [
        name,
        {
          ...page,
          href: (params: never, query: never, opt: never) => {
            return href(base, params, query, opt);
          },
        },
      ];
    }),
  ) as never;

  return { page: pages[route], pages, route, base };
};
