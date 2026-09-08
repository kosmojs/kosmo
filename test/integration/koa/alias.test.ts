import { afterAll, beforeAll, describe, test } from "vitest";

import { createTests } from "../alias-factory";

const { project, tests } = await createTests("koa");

beforeAll(async () => {
  await project.buildProject();
});

afterAll(async () => {
  await project.teardown();
});

describe("aliases", () => {
  for (const { name, runner } of tests) {
    test(name, runner);
  }
});
