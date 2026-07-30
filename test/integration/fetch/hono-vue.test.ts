import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestGroups } from ".";

const testGroups = await createTestGroups({
  backends: ["hono"],
  frameworks: ["vue"],
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
    for (const { path, run } of tests) {
      test(path, run);
    }
  });
}
