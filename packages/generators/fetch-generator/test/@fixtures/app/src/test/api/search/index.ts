import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      q: string;
      type?: "posts" | "users" | "products" | "all";
      page?: number;
      limit?: number;
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      query: string;
      filters: {
        type?: string[];
        dateRange?: { from: string; to: string };
        tags?: string[];
      };
      facets?: boolean;
    };
  }>(async (ctx) => {}),
]);
