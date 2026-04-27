import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^[a-z]{2,3}(-[A-Z]{2})?$" }>;
    };
  }>(async () => {}),
]);
