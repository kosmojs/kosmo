import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<string, { pattern: "^[A-Z]{2}$" }>;
    };
  }>(async () => {}),
]);
