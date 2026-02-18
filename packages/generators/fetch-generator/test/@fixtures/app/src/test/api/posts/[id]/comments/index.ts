import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      page?: number;
      limit?: number;
      sort?: "newest" | "oldest" | "top";
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      body: string;
      parentId?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
