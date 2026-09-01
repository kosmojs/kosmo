import { afterAll, beforeAll, describe, test } from "vitest";

import { createTestSuite } from "../ssg-factory";

const { bootstrap, teardown, tests } = await createTestSuite({
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
});

beforeAll(bootstrap);

afterAll(teardown);

describe("SSG", async () => {
  for (const { name, params, runner } of tests) {
    test(
      name,
      {
        skip: name === "landing/search/{query}" && !params.length,
      },
      runner,
    );
  }
});
