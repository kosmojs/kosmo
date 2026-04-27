import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      page?:  string;
      limit?: string;
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      name: string;
      slug: string;
      plan: "free" | "pro" | "enterprise";
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
