import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      cursor?: string;
      limit?: string;
      category?: string;
      author?: string;
      published?: string;
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      title: string;
      content: string;
      category: string;
      tags: string[];
      published: boolean;
      slug?: string;
    };
  }>(async (ctx) => {}),
]);
