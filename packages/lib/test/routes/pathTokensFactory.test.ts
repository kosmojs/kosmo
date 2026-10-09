import { join } from "node:path";

import KoaRouter from "@koa/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import { addRoute, createRouter, findRoute } from "rou3";
import { describe, expect, test } from "vitest";

import {
  createH3Pattern,
  createHonoPattern,
  createPathPattern,
  pathTokensFactory,
  sortRoutes,
} from "@kosmojs/lib";

describe("pathTokensFactory", () => {
  const routes = Object.entries(routeMap)
    .map(([pattern, { variants, exclude }]) => {
      const pathTokens = pathTokensFactory(pattern);
      return {
        pattern,
        pathPattern: createPathPattern(pathTokens),
        honoPattern: createHonoPattern(pathTokens),
        h3Pattern: createH3Pattern(pathTokens),
        pathTokens,
        variants,
        exclude,
      };
    })
    .sort(sortRoutes);

  const honoRouter = new SmartRouter({
    routers: [new RegExpRouter(), new TrieRouter()],
  });

  const h3Router = createRouter();

  const koaRouter = new KoaRouter();

  for (const {
    pattern,
    pathPattern,
    honoPattern,
    h3Pattern,
    exclude,
  } of routes) {
    if (!exclude.includes("hono")) {
      honoRouter.add("GET", join("/", honoPattern), { pattern });
    }
    if (!exclude.includes("h3")) {
      addRoute(h3Router, "GET", join("/", h3Pattern), { pattern });
    }
    if (!exclude.includes("koa")) {
      koaRouter.get(join("/", pathPattern), () => pattern);
    }
  }

  for (const {
    pattern,
    pathPattern,
    honoPattern,
    h3Pattern,
    pathTokens,
    variants,
    exclude,
  } of routes) {
    test(pattern, async () => {
      const snapshotName = pattern.replace(/\//g, " ");
      await expect(
        JSON.stringify(
          { pathPattern, honoPattern, h3Pattern, pathTokens },
          undefined,
          2,
        ),
      ).toMatchFileSnapshot(
        `@snapshots/pathTokensFactory/${snapshotName}.json`,
      );
    });

    for (const path of variants.map((path) => join("/", path))) {
      test(`${pattern} | ${path} | hono`, {
        skip: exclude.includes("hono"),
      }, () => {
        const [match] = honoRouter.match("GET", path);
        expect(
          match?.[0]?.[0],
          `expected "${pattern}" to match "${path}" via "/${honoPattern}"`,
        ).toEqual({ pattern });
      });

      test(`${pattern} | ${path} | h3`, {
        skip: exclude.includes("h3"),
      }, () => {
        const route = findRoute(h3Router, "GET", path);
        expect(
          route?.data,
          `expected "${pattern}" to match "${path}" via "/${h3Pattern}"`,
        ).toEqual({ pattern });
      });

      test(`${pattern} | ${path} | koa`, {
        skip: exclude.includes("koa"),
      }, () => {
        const match = koaRouter.match(path, "GET");
        const handler = match.path[0]?.stack[0];
        expect(
          handler?.({} as never, async () => {}),
          `expected "${pattern}" to match "${path}" via "/${pathPattern}"`,
        ).toEqual(pattern);
      });
    }
  }
});

type RouteEntry = {
  variants: readonly string[];
  exclude: Array<"hono" | "h3" | "koa">;
};

const routeMap: Record<string, RouteEntry> = {
  "some/page": { variants: ["some/page"], exclude: [] },
  "some/page.html": { variants: ["some/page.html"], exclude: [] },
  "srp/[param]": { variants: ["srp/abc", "srp/123"], exclude: [] },
  "sop/{param}": { variants: ["sop", "sop/abc"], exclude: [] },
  "ssp/{...param}": { variants: ["ssp", "ssp/a", "ssp/a/b/c"], exclude: [] },
  "rwo/[required]/with/{optional}": {
    variants: ["rwo/a/with", "rwo/b/with/optional"],
    exclude: [],
  },
  "rws/[required]/with/{...splat}": {
    variants: ["rws/a/with", "rws/b/with/c/and/d"],
    exclude: [],
  },
  "static/{optional}/{...splat}": {
    variants: ["static/optional", "static/optional/with/a/and/b"],
    exclude: [
      // Error: rou3: a route can have only one `*`, `**`, `:name+` or `:name*` (/static/*/**)
      "h3",
    ],
  },
  "index/with/path": { variants: ["with/path"], exclude: [] },
  "index/wrp/[id]": { variants: ["wrp/abc", "wrp/12"], exclude: [] },
  "index/wop/{id}": { variants: ["wop", "wop/12"], exclude: [] },
  "book-[id]": { variants: ["book-123", "book-abc"], exclude: [] },
  "files/report{format}": {
    variants: ["files/report", "files/report.pdf"],
    exclude: [],
  },
  "results.[ext]": { variants: ["results.json", "results.xml"], exclude: [] },
  "api/[name]-v[version]": {
    variants: ["api/lib-v2", "api/myapp-v10"],
    exclude: [],
  },
  "api/[id]-details": {
    variants: ["api/123-details", "api/abc-details"],
    exclude: [],
  },
  "item-[id]-info": {
    variants: ["item-123-info", "item-abc-info"],
    exclude: [],
  },
  "item-[id]{-:color}{.:format}": {
    variants: ["item-1", "item-2-red", "item-3-red.json"],
    exclude: [],
  },
  "blog{...path}.html": {
    variants: ["blog.html", "blog/post.html", "blog/2024/01/post.html"],
    exclude: [
      // Error: rou3: invalid param name "path.html" (/blog{/**:path}?.html)
      "h3",
    ],
  },
  "products{...path}.[ext]": {
    variants: ["products.json", "products/a.json", "products/a/b/c.xml"],
    exclude: [
      // Error: rou3: invalid param name "path.:ext" (/products{/**:path}?.:ext)
      "h3",
    ],
  },
  "api/[year]-[month]-[day]": {
    variants: ["api/2024-01-15", "api/2025-12-31"],
    exclude: [],
  },
  "api/v[version].json": {
    variants: ["api/v1.json", "api/v2.json"],
    exclude: [],
  },
  "api/v1/products/book-[id]/reviews{...path}.json": {
    variants: [
      "api/v1/products/book-123/reviews.json",
      "api/v1/products/book-123/reviews/latest.json",
    ],
    exclude: [
      // Error: rou3: invalid param name "path.json" (/api/v1/products/book\-:id/reviews{/**:path}?.json)
      "h3",
    ],
  },
  "api/[name]-v[version]/[resource].[ext]": {
    variants: ["api/mylib-v2/data.json", "api/app-v10/schema.xml"],
    exclude: [],
  },
  "app/[name]{-v:version{-:pre}}": {
    variants: ["app/widget", "app/widget-v2", "app/widget-v2-beta"],
    exclude: [
      // Error: rou3: unbalanced or nested `{}` (/app/:name{\-v:version{\-:pre}?}?)
      "h3",
    ],
  },
  "locale{-:lang{-:country}}": {
    variants: ["locale-en-US", "locale-en", "locale"],
    exclude: [
      // Error: rou3: unbalanced or nested `{}` (/locale{\-:lang{\-:country}?}?)
      "h3",
    ],
  },
  "files/[name]{@[version]{.[min]}}.js": {
    variants: ["files/react.js", "files/react@18.js", "files/react@18.min.js"],
    exclude: [
      // Error: rou3: unbalanced or nested `{}` (/files/:name{@:version{.:min}?}?.js)
      "h3",
    ],
  },
};
