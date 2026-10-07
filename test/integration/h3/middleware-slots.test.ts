import { describe, test } from "vitest";

import { createTests } from "../middleware-slots";

describe("middleware slots", async ({ afterAll }) => {
  const { tests, teardown } = await createTests("h3");

  afterAll(teardown);

  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
