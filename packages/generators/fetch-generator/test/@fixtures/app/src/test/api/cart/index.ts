import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST, DELETE }) => [
  GET<{
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      productId: string;
      quantity: number;
      variant?: string;
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
