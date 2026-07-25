import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contentPatternFor } from "..";
import { routes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

const {
  bootstrapProject,
  withPageContent,
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
      const { path, content, contentPattern } = await withPageContent([
        "about",
      ]);
      expect(path).toBe("about");
      expect(content).toMatch(contentPattern);
    });

    it("should render deeply nested static route with default template", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "blog/posts",
      ]);
      expect(path).toBe("blog/posts");
      expect(content).toMatch(contentPattern);
    });

    it("should render static route with extension", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "blog/index.html",
      ]);
      expect(path).toBe("blog/index.html");
      expect(content).toMatch(contentPattern);
    });
  });

  describe("Required Parameters", () => {
    it("should render route with single required parameter", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "users/[id]",
        { id: "123" },
      ]);
      expect(path).toBe("users/123");
      expect(content).toMatch(contentPattern);
    });

    it("should render route with multiple required parameters", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "posts/[userId]/comments/[commentId]",
        { userId: "456", commentId: "789" },
      ]);
      expect(path).toBe("posts/456/comments/789");
      expect(content).toMatch(contentPattern);
    });

    it("should handle numeric parameter values", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "users/[id]",
        { id: "999" },
      ]);
      expect(path).toBe("users/999");
      expect(content).toMatch(contentPattern);
    });

    it("should handle string parameter values", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "users/[id]",
        { id: "john-doe" },
      ]);
      expect(path).toBe("users/john-doe");
      expect(content).toMatch(contentPattern);
    });
  });

  describe("Optional Parameters", () => {
    it("should render route without optional parameter", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "products/{category}",
      ]);
      expect(path).toBe("products");
      expect(content).toMatch(contentPattern);
    });

    it("should render route with optional parameter provided", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "products/{category}",
        { category: "electronics" },
      ]);
      expect(path).toBe("products/electronics");
      expect(content).toMatch(contentPattern);
    });

    it("should handle multiple optional parameters", async () => {
      // With first parameter only
      {
        const { path, content, contentPattern } = await withPageContent([
          "search/{query}/{page}",
          { query: "laptops" },
        ]);
        expect(path).toBe("search/laptops");
        expect(content).toMatch(contentPattern);
      }

      // With both parameters
      {
        const { path, content, contentPattern } = await withPageContent([
          "search/{query}/{page}",
          { query: "laptops", page: "2" },
        ]);
        expect(path).toBe("search/laptops/2");
        expect(content).toMatch(contentPattern);
      }
    });
  });

  describe("Splat Parameters", () => {
    it("should render route with splat parameter - single segment", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "docs/{...path}",
        { path: ["getting-started"] },
      ]);
      expect(path).toBe("docs/getting-started");
      expect(content).toMatch(contentPattern);
    });

    it("should render route with splat parameter - multiple segments", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "docs/{...path}",
        { path: ["api", "reference", "types"] },
      ]);
      expect(path).toBe("docs/api/reference/types");
      expect(content).toMatch(contentPattern);
    });

    it("should render route with splat parameter - deeply nested", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "docs/{...path}",
        { path: ["guides", "deployment", "production", "best-practices"] },
      ]);
      expect(path).toBe("docs/guides/deployment/production/best-practices");
      expect(content).toMatch(contentPattern);
    });

    it("should render without trailing slash", async () => {
      const { path, content } = await withPageContent("docs");
      expect(path).toBe("docs");
      expect(content).toMatch(contentPatternFor("docs/{...path}"));
    });

    it("should render with trailing slash", async () => {
      const { path, content } = await withPageContent("docs/");
      expect(path).toBe("docs/");
      expect(content).toMatch(contentPatternFor("docs/{...path}"));
    });
  });

  describe("Combined Parameters", () => {
    it("should handle required + optional parameters", async () => {
      // Without optional
      {
        const { path, content, contentPattern } = await withPageContent([
          "shop/[category]/{subcategory}",
          { category: "electronics" },
        ]);
        expect(path).toBe("shop/electronics");
        expect(content).toMatch(contentPattern);
      }

      // With optional
      {
        const { path, content, contentPattern } = await withPageContent([
          "shop/[category]/{subcategory}",
          { category: "electronics", subcategory: "laptops" },
        ]);
        expect(path).toBe("shop/electronics/laptops");
        expect(content).toMatch(contentPattern);
      }
    });

    it("should handle required + splat parameters", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "files/[bucket]/{...path}",
        { bucket: "my-bucket", path: ["folder", "subfolder", "file.txt"] },
      ]);
      expect(path).toBe("files/my-bucket/folder/subfolder/file.txt");
      expect(content).toMatch(contentPattern);
    });
  });

  describe("Route Specificity", () => {
    it("should prioritize static routes over dynamic routes", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "priority/profile",
      ]);
      expect(path).toBe("priority/profile");
      expect(content).toMatch(contentPattern);
      expect(content).not.toMatch(contentPatternFor("priority/[id]"));
    });

    it("should match dynamic route for non-static values", async () => {
      const { path, content, contentPattern } = await withPageContent([
        "priority/[id]",
        { id: "123" },
      ]);
      expect(path).toBe("priority/123");
      expect(content).toMatch(contentPattern);
      expect(content).not.toMatch(contentPatternFor("priority/profile"));
    });
  });
});
