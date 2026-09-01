import { afterAll, beforeAll, describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestSuite } from "../ssg-factory";

const { bootstrap, teardown, tests } = await createTestSuite({
  framework: "vue",
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

beforeAll(bootstrap);

afterAll(teardown);

describe("SSG", async () => {
  for (const { name, runner } of tests) {
    test(name, runner);
  }
});
