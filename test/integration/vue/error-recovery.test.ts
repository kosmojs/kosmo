import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestGroups, skip } from "../error-recovery";

const testGroups = await createTestGroups({ framework: "vue" });

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
  describe(name, { skip }, () => {
    for (const [path, runner] of tests) {
      test(path, runner);
    }
  });
}
