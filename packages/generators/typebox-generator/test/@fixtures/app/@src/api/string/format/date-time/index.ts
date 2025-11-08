import { defineRoute } from "@kosmojs/api";

export default defineRoute(({ POST }) => [
  POST<{
    value: TRefine<string, { format: "date-time" }>;
  }>(async () => {}),
]);
