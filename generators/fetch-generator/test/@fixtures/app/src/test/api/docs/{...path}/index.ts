import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      version?: string;
      lang?: string;
    };
  }>(async (ctx) => {}),
]);
