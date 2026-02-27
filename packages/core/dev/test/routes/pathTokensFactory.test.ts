import { match } from "path-to-regexp";
import { describe, test } from "vitest";

import { pathTokensFactory } from "@src/routes-factory/base";

const testMap = {
  // Static segments
  "static parts only": ["some/page", ["some/page"]],
  "static: with extension": ["some/page.html", ["some/page.html"]],

  // Pure params
  "param: required": ["some/:param", ["some/abc", "some/123"]],
  "param: optional": ["some/{:param}", ["some", "some/abc"]],
  "param: splat": ["some/{...param}", ["some", "some/a", "some/a/b/c"]],
  "param: combined": [
    ":required/with/{...splat}",
    ["required/with", "required/with/a/and/b"],
  ],

  // Index
  "index: with static segment": ["index/with/path", ["with/path"]],
  "index: with param": ["index/with/:id", ["with/abc", "with/12"]],

  // Mixed segments
  "mixed: static prefix with required param": [
    "book-:id",
    ["book-123", "book-abc"],
  ],
  "mixed: static prefix with optional param": [
    "files/report{.:format}",
    ["files/report", "files/report.pdf"],
  ],
  "mixed: dot separator with required param": [
    "results.:ext",
    ["results.json", "results.xml"],
  ],
  "mixed: multiple required params": [
    "api/:name-v:version",
    ["api/lib-v2", "api/myapp-v10"],
  ],
  "mixed: required and optional params": [
    "api/:name{-v:version}",
    ["api/lib", "api/lib-v2"],
  ],
  "mixed: static suffix after param": [
    "api/:id-details",
    ["api/123-details", "api/abc-details"],
  ],
  "mixed: static prefix and suffix around param": [
    "api/item-:id-info",
    ["api/item-123-info", "api/item-abc-info"],
  ],
  "mixed: splat with extension": [
    "blog{...path}.html",
    ["blog.html", "blog/post.html", "blog/2024/01/post.html"],
  ],
  "mixed: splat with dynamic extension": [
    "products{...path}.:ext",
    ["products.json", "products/a.json", "products/a/b/c.xml"],
  ],
  "mixed: three params with separators": [
    "api/:year-:month-:day",
    ["api/2024-01-15", "api/2025-12-31"],
  ],
  "mixed: param between static parts with dots": [
    "api/v:version.json",
    ["api/v1.json", "api/v2.json"],
  ],
  "mixed: full path with mixed and pure segments": [
    "api/v1/products/book-:id/reviews{...path}.json",
    [
      "api/v1/products/book-123/reviews.json",
      "api/v1/products/book-123/reviews/latest.json",
    ],
  ],
  "mixed: full path with multiple mixed segments": [
    "api/:name-v:version/:resource.:ext",
    ["api/mylib-v2/data.json", "api/app-v10/schema.xml"],
  ],

  // Nested optional groups
  "mixed: nested optional groups": [
    "app/:name{-v:version{-:pre}}",
    ["app/widget", "app/widget-v2", "app/widget-v2-beta"],
  ],
  "mixed: CDN-style nested optionals": [
    "files/:name{@:version{.:min}}.js",
    ["files/react.js", "files/react@18.js", "files/react@18.min.js"],
  ],
} as const;

describe("pathTokensFactory", () => {
  for (const [testName, [original, paths]] of Object.entries(testMap)) {
    const [pathTokens, pathPattern] = pathTokensFactory(original);
    const matchFn = match(pathPattern);
    test(testName, async ({ expect }) => {
      await expect(JSON.stringify(pathTokens, null, 2)).toMatchFileSnapshot(
        `@snapshots/pathTokensFactory/${testName}.json`,
      );
      for (const path of paths) {
        expect(
          matchFn(path),
          `expected "${original}" to match "${path}" via "${pathPattern}"`,
        ).toBeTruthy();
      }
    });
  }
});
