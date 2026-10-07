import { load } from "cheerio";
import { describe, it } from "vitest";

import { defaults } from "@kosmojs/core";

import { routes } from "../@fixtures/generic/routes";
import { setupTestProject } from "../setup";

// Generate template from test cases
const navigationLinks = routes.map(({ id, name, params, label }) => {
  const paramsStr = Object.values(params)
    .map((val) => JSON.stringify(val))
    .join(", ");
  return `
    <Link to={["${name}", ${paramsStr}]} data-testid="${id}">
      ${label}
    </Link>
  `;
});

const navigationTemplate = `
  import Link from "${defaults.srcPrefix}/components/Link";
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

describe("Link component", async ({ afterAll }) => {
  const {
    //
    bootstrapProject,
    withPageContent,
    createPageRoutes,
  } = await setupTestProject(
    { frontend: "react" },
    {
      frontend: {
        templates: {
          navigation: navigationTemplate,
        },
      },
    },
  );

  const teardown = await bootstrapProject(async () => {
    await createPageRoutes([...routes]);
  });

  afterAll(teardown);

  it("should render all links with correct hrefs", async ({ expect }) => {
    const { content } = await withPageContent(["navigation"]);
    // Verify page renders
    expect(content).toMatch("Navigation Links Test");
    expect(content).toMatch('data-testid="navigation-page"');

    const $ = load(content);

    // Use Cheerio's selector API to find and verify links
    for (const link of routes) {
      const element = $(`a[data-testid="${link.id}"]`);

      // Verify link exists (Cheerio doesn't have visibility concept)
      expect(element.length).toBe(1);

      // Verify href attribute
      const href = element.attr("href");
      expect(href).toContain(link.href);

      // Verify text content
      const text = element.text().trim(); // trim() removes whitespace
      expect(text).toBe(link.label);
    }

    // Verify total link count
    const allLinks = $("a");
    expect(allLinks.length).toBe(routes.length);
  });
});
