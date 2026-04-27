import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      metrics: string[];
      groupBy?: string[];
      from?: string;
      to?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
