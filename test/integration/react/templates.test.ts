import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { routes, setupTestProject } from "../setup";

const landingContentID = `landing-content-${Date.now()}`;
const landingContent = `Landing Page Content: [ ${landingContentID} ]`;
const landingTemplate = `
export default () => {
  return (
    <div data-testid="${landingContentID}">${landingContent}</div>
  );
}`;

const marketingContentID = `marketing-content-${Date.now()}`;
const marketingContent = `Marketing Page Content: [ ${marketingContentID} ]`;
const marketingTemplate = `
export default () => {
  return (
    <div data-testid="${marketingContentID}">${marketingContent}</div>
  );
}`;

const {
  bootstrapProject,
  withPageContent,
  defaultContentPatternFor,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({
  framework: "react",
  frameworkOptions: {
    templates: {
      landing: landingTemplate,
      "landing/**/*": landingTemplate,
      "marketing/**/*": marketingTemplate,
    },
  },
});

beforeAll(async () => {
  await bootstrapProject();
  await createPageRoutes([...routes]);
  await startServer();
});

afterAll(teardown);

describe("React - Custom Templates", async () => {
  describe("Pattern Matching", () => {
    it("should use custom template for matching route pattern", async () => {
      await withPageContent("landing", {}, ({ content }) => {
        expect(content).toMatch(landingContent);
        expect(content, content).toMatch(`data-testid="${landingContentID}"`);
        expect(content).not.toMatch(defaultContentPatternFor("landing"));
      });
    });

    it("should use custom template for nested matching route", async () => {
      await withPageContent("landing/about", {}, ({ content }) => {
        expect(content).toMatch(landingContent);
        expect(content).not.toMatch(defaultContentPatternFor("landing/about"));
      });
    });

    it("should use custom template for glob pattern match", async () => {
      await withPageContent("marketing/campaigns/summer", {}, ({ content }) => {
        expect(content).toMatch(marketingContent);
        expect(content).not.toMatch(
          defaultContentPatternFor("marketing/campaigns/summer"),
        );
      });
    });

    it("should use default template for non-matching route", async () => {
      await withPageContent(
        "products/list",
        {},
        ({ content, defaultContentPattern }) => {
          expect(content).toMatch(defaultContentPattern);
          expect(content).not.toMatch(landingContent);
          expect(content).not.toMatch(marketingContent);
        },
      );
    });
  });

  describe("Dynamic Routes with Custom Templates", () => {
    it("should apply custom template to dynamic routes", async () => {
      await withPageContent(
        "landing/:slug",
        { slug: "product-a" },
        ({ content }) => {
          expect(content).toMatch(landingContent);
        },
      );
    });

    it("should apply custom template to routes with optional params", async () => {
      // Without optional param
      await withPageContent("landing/search/{:query}", {}, ({ content }) => {
        expect(content).toMatch(landingContent);
      });

      // With optional param
      await withPageContent(
        "landing/search/{:query}",
        { query: "shoes" },
        ({ content }) => {
          expect(content).toMatch(landingContent);
        },
      );
    });

    it("should apply custom template to routes with splat params", async () => {
      await withPageContent(
        "landing/docs/{...path}",
        { path: ["guide", "getting-started"] },
        ({ content }) => {
          expect(content).toMatch(landingContent);
        },
      );
    });
  });
});
