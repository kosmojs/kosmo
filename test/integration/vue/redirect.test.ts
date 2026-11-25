import { describe, test } from "vitest";

import { createTestGroups, skip } from "../redirect-factory";

for (const { name, createHarness } of createTestGroups("vue")) {
  describe(name, { skip }, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [path, runner] of tests) {
      test(path, runner);
    }
  });
}
