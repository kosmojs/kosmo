import { describe, test } from "vitest";

import { createHarness, skip } from "../error-boundary";

const frontend = "vue";

describe(frontend, { skip }, async ({ afterAll }) => {
  const { tests, teardown } = await createHarness({ frontend });

  afterAll(teardown);

  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
