import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../link-factory";

const testGroups = createTestGroups({
  frontend: "svelte",
  template({ links }) {
    // `to` is an expression attribute, not a quoted string:
    // route names contain braces (`docs/{...path}`) and Svelte interpolates `{...}`
    // inside quoted attribute values, so a quoted form would be parsed as an expression
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
      <script lang="ts">
        import Link from "${defaults.srcPrefix}/components/Link.svelte";
      </script>

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
