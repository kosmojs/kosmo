import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestGroups } from "../fetch";

const testGroups = await createTestGroups({
  frameworks: ["mdx"],
});

beforeAll(async () => {
  for (const { project } of testGroups) {
    await project.startServer();
  }
});

afterAll(async () => {
  for (const { project } of testGroups) {
    await project.teardown();
  }
});

for (const { name, tests } of testGroups) {
  describe(name, () => {
    for (const [name, runner] of tests) {
      test(name, runner);
    }
  });
}
