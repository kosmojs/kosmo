import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestGroups } from "../ssg-factory";

const testGroups = await createTestGroups({
  framework: "mdx",
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
