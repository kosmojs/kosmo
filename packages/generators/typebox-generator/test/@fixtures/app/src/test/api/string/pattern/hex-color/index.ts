import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$" }>;
    };
  }>(async () => {}),
]);
