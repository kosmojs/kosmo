import { describe, test } from "vitest";

import { createFrontendTestGroups } from "../templates-factory";

const testGroups = createFrontendTestGroups({
  frontend: "vue",
  page: (id) => `
    <template>
      <div data-testid="${id}">${id}</div>
    </template>
  `,
  layout: (id) => `
    <template>
      <div data-testid="${id}">
        <router-view />
      </div>
    </template>
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
