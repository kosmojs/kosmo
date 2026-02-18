import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<string, { pattern: "^\\+?[1-9][0-9]{4,14}$" }>;
    };
  }>(async () => {}),
]);
