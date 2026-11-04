import { describe, test } from "vitest";

import { createBackendTestGroups } from "../templates-factory";

const testGroups = createBackendTestGroups("koa");

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [name, runner] of tests) {
      test(name, runner);
    }
  });
}
