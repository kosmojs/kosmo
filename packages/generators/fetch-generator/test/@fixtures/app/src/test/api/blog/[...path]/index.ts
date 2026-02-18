import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      format?: "html" | "json" | "markdown";
    };
  }>(async (ctx) => {}),
]);
