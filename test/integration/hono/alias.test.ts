import { describe, test } from "vitest";

import { createTestGroups } from "../alias-factory";

const testGroups = createTestGroups("hono");

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [name, runner] of tests) {
      test(name, runner);
    }
  });
}
