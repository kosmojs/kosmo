import { describe, test } from "vitest";

import { createFrontendTestGroups } from "../templates-factory";

const testGroups = createFrontendTestGroups({
  frontend: "solid",
  page: (id) => `
    export default function Page() {
      return <div data-testid="${id}">${id}</div>;
    }
  `,
  layout: (id) => `
    import type { ParentComponent } from "solid-js";
    const Layout: ParentComponent = (props) => {
      return <div data-testid="${id}">{props.children}</div>;
    };
    export default Layout;
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
