import { defineRoute } from "@kosmojs/api";

export default defineRoute(({ POST }) => [
  POST<{
    value: TRefine<string, { format: "idn-hostname" }>;
  }>(async () => {}),
]);
