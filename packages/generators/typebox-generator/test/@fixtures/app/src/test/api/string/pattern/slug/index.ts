import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<string, { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }>;
    };
  }>(async () => {}),
]);
