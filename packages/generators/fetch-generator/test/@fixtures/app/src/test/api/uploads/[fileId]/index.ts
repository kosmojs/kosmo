import { defineRoute } from "@test/index";

export default defineRoute(({ GET, DELETE }) => [
  GET<{
    query: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "png" | "jpg";
    };
  }>(async (ctx) => {}),

  DELETE<{
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
