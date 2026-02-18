import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<string, { pattern: "^[0-9]{13,19}$" }>;
    };
  }>(async () => {}),
]);
