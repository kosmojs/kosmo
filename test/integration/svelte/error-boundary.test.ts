import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestSuite, skip } from "../error-boundary";

const frontend = "svelte";

const { project, tests } = await createTestSuite({ frontend });

beforeAll(async () => {
  await project.startServer();
});

afterAll(async () => {
  await project.teardown();
});

describe(frontend, { skip }, () => {
  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
