import { load } from "cheerio";
import { afterAll, describe, inject, it } from "vitest";

import { setupTestProject, testRoutes } from "../setup";

const ssr = inject("SSR" as never);

describe(`React Generator - Link Component: { ssr: ${ssr} }`, async () => {
  // Generate template from test cases
  const navigationLinks = testRoutes.map((link) => {
    const paramsStr = link.params.length
      ? `, ${link.params.map((p) => JSON.stringify(p)).join(", ")}`
      : "";
    return `
      <Link to={["${link.name}"${paramsStr}]} data-testid="${link.id}">
        ${link.label}
      </Link>
    `;
  });

  const navigationTemplate = `
    import Link from "@front/components/Link";
    export default () => {
      return (
        <div data-testid="navigation-page">
          <h1>Navigation Links Test</h1>
          <ol>
            ${navigationLinks.map((e) => `<li>${e}</li>`).join("")}
          </ol>
        </div>
      );
    }
  `;

  const { withRouteContent, teardown } = await setupTestProject(
    {
      name: "react",
      options: {
        templates: {
          navigation: navigationTemplate,
        },
      },
    },
    ssr,
  );

  afterAll(async () => {
    await teardown();
  });

  it("should render all links with correct hrefs", async ({ expect }) => {
    await withRouteContent("navigation", [], async ({ content }) => {
      // Verify page renders
      expect(content).toMatch("Navigation Links Test");
      expect(content).toMatch('data-testid="navigation-page"');

      const $ = load(content);

      // Use Cheerio's selector API to find and verify links
      for (const link of testRoutes) {
        const element = $(`a[data-testid="${link.id}"]`);

        // Verify link exists (Cheerio doesn't have visibility concept)
        expect(element.length).toBe(1);

        // Verify href attribute
        const href = element.attr("href");
        expect(href).toBe(link.href);

        // Verify text content
        const text = element.text().trim(); // trim() removes whitespace
        expect(text).toBe(link.label);
      }

      // Verify total link count
      const allLinks = $("a");
      expect(allLinks.length).toBe(testRoutes.length);
    });
  });
});
