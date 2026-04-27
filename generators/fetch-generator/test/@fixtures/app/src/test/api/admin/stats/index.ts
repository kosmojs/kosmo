import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      period?: "day" | "week" | "month" | "year";
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
