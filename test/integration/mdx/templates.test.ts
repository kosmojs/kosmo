import { describe, test } from "vitest";

import { createFrontendTestGroups } from "../templates-factory";

const testGroups = createFrontendTestGroups({
  frontend: "mdx",
  page: (id) => `
<div data-testid="${id}">${id}</div>
`,
  layout: (id) => `
<div data-testid="${id}">{props.children}</div>
`,
});

for (const { name, createHarness } of testGroups) {
  describe(name, async ({ afterAll }) => {
    const { tests, teardown } = await createHarness();

    afterAll(teardown);

    for (const [name, runner] of tests) {
      test(name, runner);
    }
  });
}
