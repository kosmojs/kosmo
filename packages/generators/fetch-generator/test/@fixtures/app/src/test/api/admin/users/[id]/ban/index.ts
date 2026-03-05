import { defineRoute } from "@test/index";

export default defineRoute(({ POST, DELETE }) => [
  POST<{
    json: {
      reason: string;
      duration?: number;
      permanent?: boolean;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),

  DELETE<{
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
