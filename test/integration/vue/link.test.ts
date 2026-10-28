import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../link-factory";

const testGroups = createTestGroups({
  frontend: "vue",
  template({ links }) {
    // `to` and `query` are JSON (double quotes inside),
    // so the bound attributes are single-quoted
    const anchors = links.map(({ id, to, query, label }) => {
      const queryProp = query ? `:query='${query}'` : "";
      return `
        <li>
          <Link :to='${to}' ${queryProp} data-testid="${id}">
            ${label}
          </Link>
        </li>
      `;
    });

    return `
      <script setup>
        import Link from "${defaults.srcPrefix}/components/Link.vue";
      </script>
      <template>
        <div data-testid="navigation-page">
          <h1>Navigation Links Test</h1>
          <ol>
            ${anchors.join("")}
          </ol>
        </div>
      </template>
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
