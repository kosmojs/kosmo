import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contentPatternFor } from "..";
import { routes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

const landingContentID = `landing-content-${Date.now()}`;
const landingContent = `Landing Page Content: [ ${landingContentID} ]`;
const landingTemplate = `
<div data-testid="${landingContentID}">${landingContent}</div>
`;

const marketingContentID = `marketing-content-${Date.now()}`;
const marketingContent = `Marketing Page Content: [ ${marketingContentID} ]`;
const marketingTemplate = `
<div data-testid="${marketingContentID}">${marketingContent}</div>
`;

const {
  bootstrapProject,
  withPageContent,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({
  framework: "svelte",
  svelte: {
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

describe("Svelte - Custom Templates", async () => {
  describe("Pattern Matching", () => {
    it("should use custom template for matching route pattern", async () => {
      const { content } = await withPageContent(["landing"]);
      expect(content).toMatch(landingContent);
      expect(content, content).toMatch(`data-testid="${landingContentID}"`);
      expect(content).not.toMatch(contentPatternFor("landing"));
    });

    it("should use custom template for nested matching route", async () => {
      const { content } = await withPageContent(["landing/about"]);
      expect(content).toMatch(landingContent);
      expect(content).not.toMatch(contentPatternFor("landing/about"));
    });

    it("should use custom template for glob pattern match", async () => {
      const { content } = await withPageContent(["marketing/campaigns/summer"]);
      expect(content).toMatch(marketingContent);
      expect(content).not.toMatch(
        contentPatternFor("marketing/campaigns/summer"),
      );
    });

    it("should use default template for non-matching route", async () => {
      const { content, contentPattern } = await withPageContent([
        "products/list",
      ]);
      expect(content).toMatch(contentPattern);
      expect(content).not.toMatch(landingContent);
      expect(content).not.toMatch(marketingContent);
    });
  });

  describe("Dynamic Routes with Custom Templates", () => {
    it("should apply custom template to dynamic routes", async () => {
      const { content } = await withPageContent([
        "landing/[slug]",
        { slug: "product-a" },
      ]);
      expect(content).toMatch(landingContent);
    });

    it("should apply custom template to routes with optional params", async () => {
      // Without optional param
      {
        const { content } = await withPageContent(["landing/search/{query}"]);
        expect(content).toMatch(landingContent);
      }

      // With optional param
      {
        const { content } = await withPageContent([
          "landing/search/{query}",
          { query: "shoes" },
        ]);
        expect(content).toMatch(landingContent);
      }
    });

    it("should apply custom template to routes with splat params", async () => {
      const { content } = await withPageContent([
        "landing/docs/{...path}",
        { path: ["guide", "getting-started"] },
      ]);
      expect(content).toMatch(landingContent);
    });
  });
});
