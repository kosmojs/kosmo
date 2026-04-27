import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      branch?: string;
      ref?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
