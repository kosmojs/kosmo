import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../ssg-factory";

const testGroups = createTestGroups({
  frontend: "vue",
  template({ name, paramsVariants }) {
    const staticParams = paramsVariants.length
      ? `
          <script lang="ts">
          import { defineStaticParams } from "${defaults.libPrefix}/core";
          export const staticParams = defineStaticParams<"${name}">(${JSON.stringify(paramsVariants)});
          </script>
        `
      : "";

    return `
      ${staticParams}

      <script setup lang="ts">
        // template-only component
      </script>

      <template>
        <div id="content">${name}</div>
      </template>
    `;
  },
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
