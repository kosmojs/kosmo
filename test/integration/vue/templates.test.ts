import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import { setupTestProject } from "../setup";

const ssr = inject("SSR" as never);

describe(`Vue Generator - Custom Templates: { ssr: ${ssr} }`, async () => {
  const landingContentID = `landing-content-${Date.now()}`;
  const landingContent = `Landing Page Content: [ ${landingContentID} ]`;
  const landingTemplate = `
<template>
  <div data-testid="${landingContentID}">${landingContent}</div>
</template>
`;

  const marketingContentID = `marketing-content-${Date.now()}`;
  const marketingContent = `Marketing Page Content: [ ${marketingContentID} ]`;
  const marketingTemplate = `
<template>
  <div data-testid="${marketingContentID}">${marketingContent}</div>
</template>
`;

  const {
    bootstrapProject,
    withRouteContent,
    defaultContentPatternFor,
    createRoutes,
    startServer,
    teardown,
  } = await setupTestProject({
    framework: "vue",
    frameworkOptions: {
      templates: {
        landing: landingTemplate,
        "landing/**/*": landingTemplate,
        "marketing/**/*": marketingTemplate,
      },
    },
    ssr,
  });

  await bootstrapProject();
  await createRoutes();

  beforeAll(startServer);
  afterAll(teardown);

  describe("Pattern Matching", () => {
    it("should use custom template for matching route pattern", async () => {
      await withRouteContent("landing", [], ({ content }) => {
        expect(content).toMatch(landingContent);
        expect(content, content).toMatch(`data-testid="${landingContentID}"`);
        expect(content).not.toMatch(defaultContentPatternFor("landing"));
      });
    });

    it("should use custom template for nested matching route", async () => {
      await withRouteContent("landing/about", [], ({ content }) => {
        expect(content).toMatch(landingContent);
        expect(content).not.toMatch(defaultContentPatternFor("landing/about"));
      });
    });

    it("should use custom template for glob pattern match", async () => {
      await withRouteContent(
        "marketing/campaigns/summer",
        [],
        ({ content }) => {
          expect(content).toMatch(marketingContent);
          expect(content).not.toMatch(
            defaultContentPatternFor("marketing/campaigns/summer"),
          );
        },
      );
    });

    it("should use default template for non-matching route", async () => {
      await withRouteContent(
        "products/list",
        [],
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
      await withRouteContent("landing/[slug]", ["product-a"], ({ content }) => {
        expect(content).toMatch(landingContent);
      });
    });

    it("should apply custom template to routes with optional params", async () => {
      // Without optional param
      await withRouteContent("landing/search/[[query]]", [], ({ content }) => {
        expect(content).toMatch(landingContent);
      });

      // With optional param
      await withRouteContent(
        "landing/search/[[query]]",
        ["shoes"],
        ({ content }) => {
          expect(content).toMatch(landingContent);
        },
      );
    });

    it("should apply custom template to routes with rest params", async () => {
      await withRouteContent(
        "landing/docs/[...path]",
        ["guide", "getting-started"],
        ({ content }) => {
          expect(content).toMatch(landingContent);
        },
      );
    });
  });
});
