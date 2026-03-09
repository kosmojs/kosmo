import { defineRoute } from "@test/index";

export default defineRoute(({ GET, DELETE }) => [
  GET<{
    query: {
      width?:   string;
      height?:  string;
      quality?: string;
      format?: "webp" | "png" | "jpg";
    };
  }>(async (ctx) => {}),

  DELETE<{
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
