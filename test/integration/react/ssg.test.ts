import { describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestGroups } from "../ssg-factory";

const testGroups = createTestGroups({
  frontend: "react",
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

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const { name, runner } of tests) {
      test(name, runner);
    }
  });
}
