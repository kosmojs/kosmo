import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<string, { format: "idn-hostname" }>;
    };
  }>(async () => {}),
]);
