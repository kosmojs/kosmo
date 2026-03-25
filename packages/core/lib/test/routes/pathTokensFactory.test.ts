import { match } from "path-to-regexp";
import { describe, test } from "vitest";

import { pathTokensFactory } from "@src/routes";

const map = {
  commonSyntax: {
    // Static segments
    "static parts": ["some/page", ["some/page"]],
    "static parts with extension": ["some/page.html", ["some/page.html"]],

    // Pure params
    "required param": ["some/[param]", ["some/abc", "some/123"]],
    "requiroptional param": ["some/{param}", ["some", "some/abc"]],
    "requirsplat param": ["some/{...param}", ["some", "some/a", "some/a/b/c"]],
    "required with optional": [
      "[required]/with/{optional}",
      ["required/with", "required/with/optional"],
    ],
    "required with splat": [
      "[required]/with/{...splat}",
      ["required/with", "required/with/a/and/b"],
    ],
    "optional with splat": [
      "{optional}/{...splat}",
      ["/optional", "/optional/with/a/and/b"],
    ],

    // Index
    "index with static segments": ["index/with/path", ["with/path"]],
    "index with required param": ["index/with/[id]", ["with/abc", "with/12"]],
    "index with optional param": ["index/with/{id}", ["with", "with/12"]],
    "index with splat param": ["index/{...path}", ["/", "/a", "/a/b/c"]],
  },

  mixedSegments: {
    "static prefix with required param": [
      "book-[id]",
      ["book-123", "book-abc"],
    ],
    "static prefix with optional param": [
      "files/report{format}",
      ["files/report", "files/report.pdf"],
    ],
    "dot separator with required param": [
      "results.[ext]",
      ["results.json", "results.xml"],
    ],
    "multiple required params": [
      "api/[name]-v[version]",
      ["api/lib-v2", "api/myapp-v10"],
    ],
    "static suffix after param": [
      "api/[id]-details",
      ["api/123-details", "api/abc-details"],
    ],
    "static prefix and suffix around param": [
      "api/item-[id]-info",
      ["api/item-123-info", "api/item-abc-info"],
    ],
    "splat with extension": [
      "blog{...path}.html",
      ["blog.html", "blog/post.html", "blog/2024/01/post.html"],
    ],
    "splat with dynamic extension": [
      "products{...path}.[ext]",
      ["products.json", "products/a.json", "products/a/b/c.xml"],
    ],
    "three params with separators": [
      "api/[year]-[month]-[day]",
      ["api/2024-01-15", "api/2025-12-31"],
    ],
    "param between static parts with dots": [
      "api/v[version].json",
      ["api/v1.json", "api/v2.json"],
    ],
    "full path with mixed and pure segments": [
      "api/v1/products/book-[id]/reviews{...path}.json",
      [
        "api/v1/products/book-123/reviews.json",
        "api/v1/products/book-123/reviews/latest.json",
      ],
    ],
    "full path with multiple mixed segments": [
      "api/[name]-v[version]/[resource].[ext]",
      ["api/mylib-v2/data.json", "api/app-v10/schema.xml"],
    ],
  },

  powerSyntax: {
    "required and optional params": [
      "api/[name]{-v:version}",
      ["api/lib", "api/lib-v2"],
    ],
    "nested optional groups": [
      "app/[name]{-v:version{-:pre}}",
      ["app/widget", "app/widget-v2", "app/widget-v2-beta"],
    ],
    "CDN-style nested optionals": [
      "files/[name]{@[version]{.[min]}}.js",
      ["files/react.js", "files/react@18.js", "files/react@18.min.js"],
    ],
  },
} as const;

describe("pathTokensFactory", () => {
  for (const [group, variants] of Object.entries(map)) {
    describe(group, () => {
      for (const [testName, [original, paths]] of Object.entries(variants)) {
        const [pathTokens, pathPattern] = pathTokensFactory(original);
        const matchFn = match(pathPattern);
        test(testName, async ({ expect }) => {
          await expect(JSON.stringify(pathTokens, null, 2)).toMatchFileSnapshot(
            `@snapshots/pathTokensFactory/${group}/${testName}.json`,
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
  }
});
