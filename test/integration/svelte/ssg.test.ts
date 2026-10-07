import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../ssg-factory";

const testGroups = createTestGroups({
  frontend: "svelte",
  template({ name, paramsVariants }) {
    const staticParams = paramsVariants.length
      ? `
          <script module lang="ts">
          import { defineStaticParams } from "${defaults.libPrefix}/core";
          export const staticParams = defineStaticParams<"${name}">(${JSON.stringify(paramsVariants)});
          </script>
        `
      : "";

    return `
      ${staticParams}

      <script lang="ts">
        // template-only component
      </script>

      <div id="content">{${JSON.stringify(name)}}</div>
    `;
  },
  renderModes: ["string"],
});

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const { name, runner } of tests) {
      test(name, runner);
    }
  });
}
