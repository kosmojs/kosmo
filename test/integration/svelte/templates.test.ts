import { describe, test } from "vitest";

import { createFrontendTestGroups } from "../templates-factory";

const testGroups = createFrontendTestGroups({
  frontend: "svelte",
  page: (id) => `
    <div data-testid="${id}">${id}</div>
  `,
  layout: (id) => `
    <script lang="ts">
      import type { Snippet } from "svelte";
      let { children }: { children: Snippet } = $props();
    </script>

    <div data-testid="${id}">
      {@render children()}
    </div>
  `,
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
