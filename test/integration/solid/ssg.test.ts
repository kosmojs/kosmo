import { afterAll, beforeAll, describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../ssg-factory";

const testGroups = await createTestGroups({
  framework: "solid",
  template({ name, paramsVariants }) {
    const staticParams = paramsVariants.length
      ? `
          import { defineStaticParams } from "${defaults.libPrefix}/core";
          export const staticParams = defineStaticParams<"${name}">(${JSON.stringify(paramsVariants)});
        `
      : "";

    return `
      ${staticParams}
      export default function Page() {
        return <div id="content">{${JSON.stringify(name)}}</div>
      }
    `;
  },
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
    for (const { name, runner } of tests) {
      test(name, runner);
    }
  });
}
