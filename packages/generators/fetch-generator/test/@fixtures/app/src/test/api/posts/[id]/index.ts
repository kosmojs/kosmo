import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PUT, PATCH, DELETE }) => [
  GET(async (ctx) => {}),

  PUT<{
    json: {
      title: string;
      content: string;
      category: string;
      tags: string[];
      published: boolean;
    };
  }>(async (ctx) => {}),

  PATCH<{
    json: {
      published?: boolean;
      pinned?: boolean;
      featured?: boolean;
    };
  }>(async (ctx) => {}),

  DELETE(async (ctx) => {}),
]);
