import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { routes, setupTestProject } from "../setup";

const {
  bootstrapProject,
  withPageContent,
  defaultContentPatternFor,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({ framework: "solid" });

beforeAll(async () => {
  await bootstrapProject();
  await createPageRoutes([...routes]);
  await startServer();
});

afterAll(teardown);

describe("SolidJS - Routes", async () => {
  describe("Static Routes", () => {
    it("should render nested static route with default template", async () => {
      await withPageContent(
        "about",
        {},
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("about");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render deeply nested static route with default template", async () => {
      await withPageContent(
        "blog/posts",
        {},
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("blog/posts");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render static route with extension", async () => {
      await withPageContent(
        "blog/index.html",
        {},
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("blog/index.html");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });
  });

  describe("Required Parameters", () => {
    it("should render route with single required parameter", async () => {
      await withPageContent(
        "users/:id",
        { id: "123" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("users/123");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render route with multiple required parameters", async () => {
      await withPageContent(
        "posts/:userId/comments/:commentId",
        { userId: "456", commentId: "789" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("posts/456/comments/789");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should handle numeric parameter values", async () => {
      await withPageContent(
        "users/:id",
        { id: "999" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("users/999");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should handle string parameter values", async () => {
      await withPageContent(
        "users/:id",
        { id: "john-doe" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("users/john-doe");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });
  });

  describe("Optional Parameters", () => {
    it("should render route without optional parameter", async () => {
      await withPageContent(
        "products/{:category}",
        {},
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("products");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render route with optional parameter provided", async () => {
      await withPageContent(
        "products/{:category}",
        { category: "electronics" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("products/electronics");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should handle multiple optional parameters", async () => {
      // With first parameter only
      await withPageContent(
        "search/{:query}/{:page}",
        { query: "laptops" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("search/laptops");
          expect(content).toMatch(defaultContentPattern);
        },
      );

      // With both parameters
      await withPageContent(
        "search/{:query}/{:page}",
        { query: "laptops", page: "2" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("search/laptops/2");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });
  });

  describe("Splat Parameters", () => {
    it("should render route with splat parameter - single segment", async () => {
      await withPageContent(
        "docs/{...path}",
        { path: ["getting-started"] },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("docs/getting-started");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render route with splat parameter - multiple segments", async () => {
      await withPageContent(
        "docs/{...path}",
        { path: ["api", "reference", "types"] },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("docs/api/reference/types");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render route with splat parameter - deeply nested", async () => {
      await withPageContent(
        "docs/{...path}",
        { path: ["guides", "deployment", "production", "best-practices"] },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("docs/guides/deployment/production/best-practices");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render without trailing slash", async () => {
      await withPageContent(
        "docs/{...path}",
        "docs",
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("docs");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should render with trailing slash", async () => {
      await withPageContent(
        "docs/{...path}",
        "docs/",
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("docs/");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });
  });

  describe("Combined Parameters", () => {
    it("should handle required + optional parameters", async () => {
      // Without optional
      await withPageContent(
        "shop/:category/{:subcategory}",
        { category: "electronics" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("shop/electronics");
          expect(content).toMatch(defaultContentPattern);
        },
      );

      // With optional
      await withPageContent(
        "shop/:category/{:subcategory}",
        { category: "electronics", subcategory: "laptops" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("shop/electronics/laptops");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });

    it("should handle required + splat parameters", async () => {
      await withPageContent(
        "files/:bucket/{...path}",
        { bucket: "my-bucket", path: ["folder", "subfolder", "file.txt"] },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("files/my-bucket/folder/subfolder/file.txt");
          expect(content).toMatch(defaultContentPattern);
        },
      );
    });
  });

  describe("Route Specificity", () => {
    it("should prioritize static routes over dynamic routes", async () => {
      await withPageContent(
        "priority/profile",
        {},
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("priority/profile");
          expect(content).toMatch(defaultContentPattern);
          expect(content).not.toMatch(
            defaultContentPatternFor("priority/[id]"),
          );
        },
      );
    });

    it("should match dynamic route for non-static values", async () => {
      await withPageContent(
        "priority/:id",
        { id: "123" },
        ({ path, content, defaultContentPattern }) => {
          expect(path).toBe("priority/123");
          expect(content).toMatch(defaultContentPattern);
          expect(content).not.toMatch(
            defaultContentPatternFor("priority/profile"),
          );
        },
      );
    });
  });
});
