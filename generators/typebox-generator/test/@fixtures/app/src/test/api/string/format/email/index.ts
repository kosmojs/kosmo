import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: VRefine<string, { format: "email" }>;
    };
  }>(async () => {}),
]);
