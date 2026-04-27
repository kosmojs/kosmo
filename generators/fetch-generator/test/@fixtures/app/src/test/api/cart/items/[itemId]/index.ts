import { defineRoute } from "@test/index";

export default defineRoute(({ PATCH, DELETE }) => [
  PATCH<{
    json: {
      quantity: number;
    };
  }>(async (ctx) => {}),

  DELETE(async (ctx) => {}),
]);
