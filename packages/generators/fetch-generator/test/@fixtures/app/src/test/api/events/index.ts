import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      tags?: string[];
      status?: "upcoming" | "past" | "live";
      page?: number;
      limit?: number;
    };
  }>(async (ctx) => {}),
]);
