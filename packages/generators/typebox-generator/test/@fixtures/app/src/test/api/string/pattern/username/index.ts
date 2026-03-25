import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{3,20}$" }>;
    };
  }>(async () => {}),
]);
