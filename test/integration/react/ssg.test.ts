import { afterAll, beforeAll, describe, test } from "vitest";

import { defaults } from "@kosmojs/core";

import { createTestSuite } from "../ssg-factory";

const { bootstrap, teardown, tests } = await createTestSuite({
  framework: "react",
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

beforeAll(bootstrap);

afterAll(teardown);

describe("SSG", async () => {
  for (const { name, runner } of tests) {
    test(name, runner);
  }
});
