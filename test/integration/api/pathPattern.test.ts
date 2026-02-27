import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { pathResolver } from "@kosmojs/dev";

import { setupTestProject } from "../setup";

const routes = {
  // index
  index: [{}],
  "index/static": [{}],
  "index/:required-param": [{ required: "param" }],
  "index/with/{:optional-param}": [{}, { optional: "param" }],

  // admin
  "admin/:tenant/resources/{:type}": [
    { tenant: "acme", type: "posts" },
    { tenant: "acme" },
  ],
  "admin/:tenant/resources/{...path}": [
    { tenant: "acme", path: ["edit", "123"] },
    // path with a single segment, e.g. ["edit"],
    // is matched by admin/:tenant/resources/{:type}
  ],

  // Underscore as a literal delimiter
  "user_:id": [
    { id: "123" }, // "/user_123"
  ],

  // app
  "app/:name{-v:version{-:pre}}": [
    { name: "widget", version: "2", pre: "beta" },
    { name: "widget", version: "2" },
    { name: "widget" },
  ],

  // Multiple optional groups in one segment (adjacent with different delimiters)
  "archive{.:format}{-:compression}": [
    {}, // "/archive"
    { format: "tar" }, // "/archive.tar"
    { compression: "gz" }, // "/archive-gz"
    { format: "tar", compression: "gz" }, // "/archive.tar-gz"
  ],

  // blog
  "blog/{:category}": [{ category: "tech" }, {}],
  "blog/{:category}/{...page}": [
    { category: "dev", page: ["2024", "01", "hello-world"] },
  ],

  // docs
  "docs/{...path}": [
    { path: ["api", "reference", "types"] },
    { path: ["getting-started"] },
    {},
  ],

  // files
  "files/report{.:format}": [{ format: "pdf" }, {}],
  "files/:name{@:version{.:min}}.js": [
    { name: "react", version: "18", min: "min" },
    { name: "react", version: "18" },
    { name: "react" },
  ],
  "files/{...dir}/:name": [
    { name: "readme.md" }, // dir empty → "/files/readme.md"
    { dir: ["docs"], name: "readme.md" }, // "/files/docs/readme.md"
    { dir: ["projects", "2024"], name: "plan.pdf" }, // "/files/projects/2024/plan.pdf"
  ],

  // Multiple optional groups after a required parameter within a segment
  "item-:id{-:color}{.:format}": [
    { id: "42" }, // "/item-42"
    { id: "42", color: "red" }, // "/item-42-red"
    { id: "42", format: "json" }, // "/item-42.json"
    { id: "42", color: "red", format: "json" }, // "/item-42-red.json"
  ],

  // Optional parameter in the middle of a segment
  "book{-:id}-info": [
    {}, // "/book-info"
    { id: "123" }, // "/book-123-info"
  ],

  // Two wildcards separated by a static segment
  "file-manager/{...before}/static/{...after}": [
    { after: ["page"] },
    { before: ["assets"], after: ["css"] },
    { before: ["cdn", "images"], after: ["logo.png"] },
  ],

  // Optional group containing multiple parameters and literals
  "locale{-:lang{-:country}}": [
    {}, // "/locale"
    { lang: "en" }, // "/locale-en"
    { lang: "en", country: "US" }, // "/locale-en-US"
  ],

  // landing
  "landing/search/{:query}": [{ query: "deals" }, {}],
  "landing/docs/{...path}": [{ path: ["guide"] }, {}],

  // logs
  "logs/:year-:month-:day": [{ year: "2024", month: "01", day: "15" }],

  // mixed (standalone segments)
  ":id-details": [{ id: "42" }],
  "item-:id-info": [{ id: "42" }],
  "results.:ext": [{ ext: "html" }],

  // changelog
  "changelog/v:version.html": [{ version: "3" }],

  // pages
  "pages/:name-v:version/:resource.:ext": [
    { name: "docs", version: "2", resource: "readme", ext: "md" },
  ],

  // news
  "news/:category/articles/{...articlePath}": [
    { category: "nature", articlePath: ["cruises", "islands"] },
    { category: "world" },
  ],

  // products
  "products/{:category}": [{ category: "electronics" }, {}],
  "products/{...path}.:ext": [
    { path: ["electronics", "phones"], ext: "json" },
    { ext: "json" },
  ],

  // profile
  "profile/:username/posts/:postId/comments/{...thread}": [
    { username: "john", postId: "post-123", thread: ["reply", "123"] },
    { username: "john", postId: "post-123" },
  ],

  // projects
  "projects/:projectId/files/{...path}": [
    { projectId: "proj-100", path: ["docs", "README.md"] },
    { projectId: "proj-100" },
  ],

  // search
  "search/{:query}/{:page}": [
    { query: "laptops", page: "2" },
    { query: "laptops" },
    {},
  ],

  // shop
  "shop/:category/{:subcategory}": [
    { category: "electronics", subcategory: "laptops" },
    { category: "electronics" },
  ],
  "shop/products/{:category}": [{ category: "electronics" }, {}],

  // store
  "store/:category/{...filters}": [
    { category: "books", filters: ["fiction", "science"] },
    { category: "books" },
  ],

  // v1
  "v1/products/book-:id/{:category-}reviews": [
    { id: "1", category: "top-rated" },
    { id: "1" },
  ],

  // workspace
  "workspace/:workspaceId/team/:memberId/permissions/{...permissionPath}": [
    {
      workspaceId: "ws-7",
      memberId: "member-3",
      permissionPath: ["admin", "manager"],
    },
    { workspaceId: "ws-7", memberId: "member-3" },
  ],
};

const {
  sourceFolder,
  bootstrapProject,
  createApiRoutes,
  withApiResponse,
  startServer,
  teardown,
} = await setupTestProject({ backend: "koa" });

const { createImport } = pathResolver({ sourceFolder });

beforeAll(async () => {
  await bootstrapProject();

  await createApiRoutes(
    Object.keys(routes).map((name) => {
      return { name };
    }),
    async ({ name }) => {
      return () => {
        return `
          import { defineRoute } from "${createImport.libApi(name)}";
          export default defineRoute(({ GET }) => [
            GET((ctx) => {
              ctx.body = { route: "${name}", params: ctx.validated.params };
            }),
          ]);
        `;
      };
    },
  );

  await startServer();
});

afterAll(teardown);

describe("API - pathPattern", async () => {
  for (const [route, variants] of Object.entries(routes)) {
    for (const params of variants) {
      test(`${route} | ${JSON.stringify(Object.values(params))}`, async () => {
        await withApiResponse(route, params, ({ response }) => {
          expect(JSON.parse(response.body as never)).toEqual({ route, params });
        });
      });
    }
  }
});
