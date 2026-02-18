import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      fields?: string[];
    };
  }>(async (ctx) => {}),
]);
