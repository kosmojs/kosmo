import { defineRoute } from "@test/index";

export default defineRoute(({ PATCH, DELETE }) => [
  PATCH<{
    json: {
      read: boolean;
    };
  }>(async (ctx) => {}),

  DELETE(async (ctx) => {}),
]);
