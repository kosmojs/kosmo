import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PUT, DELETE }) => [
  GET<{
    query: {
      include?: "posts" | "comments" | "profile";
    };
  }>(async (ctx) => {}),

  PUT<{
    json: {
      name?: string;
      email?: string;
      bio?: string;
      timezone?: string;
    };
  }>(async (ctx) => {}),

  DELETE(async (ctx) => {}),
]);
