import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^[A-Z]{3}$" }>;
    };
  }>(async () => {}),
]);
