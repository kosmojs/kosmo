import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }>;
    };
  }>(async () => {}),
]);
