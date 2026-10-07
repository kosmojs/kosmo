import { describe, test } from "vitest";

import { createTestGroups, skip } from "../error-recovery";

const testGroups = createTestGroups({ frontend: "vue" });

for (const { name, createHarness } of testGroups) {
  describe(name, { skip }, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [path, runner] of tests) {
      test(path, runner);
    }
  });
}
