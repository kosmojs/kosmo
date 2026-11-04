import { describe, test } from "vitest";

import { createFrontendTestGroups } from "../templates-factory";

const testGroups = createFrontendTestGroups({
  frontend: "react",
  page: (id) => `
    export default function Page() {
      return <div data-testid="${id}">${id}</div>;
    }
  `,
  layout: (id) => `
    import { Outlet } from "react-router";
    export default function Layout() {
      return (
        <div data-testid="${id}">
          <Outlet />
        </div>
      );
    }
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
