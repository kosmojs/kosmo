import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../link-factory";

const testGroups = createTestGroups({
  frontend: "mdx",
  template({ links }) {
    const anchors = links.map(({ id, to, query, label }) => {
      const queryProp = query ? `query={${query}}` : "";
      return `
        <li>
          <Link to={${to}} ${queryProp} data-testid="${id}">
            ${label}
          </Link>
        </li>
      `;
    });

    return `
import Link from "${defaults.srcPrefix}/components/Link.tsx";

<div data-testid="navigation-page">
  <h1>Navigation Links Test</h1>
  <ol>
    ${anchors.join("")}
  </ol>
</div>
`;
  },
});

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [name, runner] of tests) {
      test(name, runner);
    }
  });
}
