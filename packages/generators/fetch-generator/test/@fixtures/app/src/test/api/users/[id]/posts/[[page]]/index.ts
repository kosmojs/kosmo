import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      status?: "draft" | "published" | "archived";
      tag?: string;
    };
  }>(async (ctx) => {}),
]);
