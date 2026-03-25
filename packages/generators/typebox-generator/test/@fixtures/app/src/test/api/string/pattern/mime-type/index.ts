import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^[a-z]+/[a-z0-9.+-]+$" }>;
    };
  }>(async () => {}),
]);
