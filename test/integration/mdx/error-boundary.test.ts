import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestSuite, skip } from "../error-boundary";

const framework = "mdx";

const { project, tests } = await createTestSuite({ framework });

beforeAll(async () => {
  await project.startServer();
});

afterAll(async () => {
  await project.teardown();
});

describe(framework, { skip }, () => {
  for (const [name, runner] of tests) {
    test(name, runner);
  }
});
