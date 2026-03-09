import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      page?:  string;
      limit?: string;
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
