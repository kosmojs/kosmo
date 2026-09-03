import { afterAll, beforeAll, describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../ssg-factory";

const testGroups = await createTestGroups({
  framework: "svelte",
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

beforeAll(async () => {
  for (const { project } of testGroups) {
    await project.startServer();
  }
});

afterAll(async () => {
  for (const { project } of testGroups) {
    await project.teardown();
  }
});

for (const { name, tests } of testGroups) {
  describe(name, () => {
    for (const { name, runner } of tests) {
      test(name, runner);
    }
  });
}
