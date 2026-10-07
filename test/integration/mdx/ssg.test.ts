import { describe, test } from "vitest";

import { createTestGroups } from "../ssg-factory";

const testGroups = createTestGroups({
  frontend: "mdx",
  template({ name, paramsVariants }) {
    const staticParams = paramsVariants.length
      ? [
          "---",
          "staticParams:",
          ...paramsVariants.map((e) => `  - ${JSON.stringify(e)}`),
          "---",
        ].join("\n")
      : "";

    return `${staticParams}

<div id="content">{${JSON.stringify(name)}}</div>
`;
  },
  renderModes: ["string"],
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
