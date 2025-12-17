import { load } from "cheerio";
import { afterAll, beforeAll, describe, it } from "vitest";

import { routes, setupTestProject, sourceFolder } from "../setup";

// Generate template from test cases
const navigationLinks = routes.map(({ id, name, params, label }) => {
  const paramsArr = Object.values(params).flat();
  const paramsStr = paramsArr.length
    ? `, ${paramsArr.map((p) => JSON.stringify(p)).join(", ")}`
    : "";
  return `
    <Link to={["${name}"${paramsStr}]} data-testid="${id}">
      ${label}
    </Link>
  `;
});

const navigationTemplate = `
  import Link from "${sourceFolder}/components/Link";
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

const {
  bootstrapProject,
  withPageContent,
  createPageRoutes,
  startServer,
  teardown,
} = await setupTestProject({
  framework: "react",
  frameworkOptions: {
    templates: {
      navigation: navigationTemplate,
    },
  },
});

beforeAll(async () => {
  await bootstrapProject();
  await createPageRoutes(routes);
  await startServer();
});

afterAll(teardown);

describe("React - Link Component", async () => {
  it("should render all links with correct hrefs", async ({ expect }) => {
    await withPageContent("navigation", {}, async ({ content }) => {
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
        expect(href).toBe(link.href);

        // Verify text content
        const text = element.text().trim(); // trim() removes whitespace
        expect(text).toBe(link.label);
      }

      // Verify total link count
      const allLinks = $("a");
      expect(allLinks.length).toBe(routes.length);
    });
  });
});
