import { describe, test } from "vitest";

import { createTestGroups } from "../page-routes-factory";

for (const { name, createHarness } of createTestGroups("svelte")) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [path, runner] of tests) {
      test(path, runner);
    }
  });
}
