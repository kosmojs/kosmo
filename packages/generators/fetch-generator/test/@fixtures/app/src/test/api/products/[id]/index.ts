import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      currency?: string;
      includeReviews?: boolean;
    };
  }>(async (ctx) => {}),
]);
