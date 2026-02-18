import { defineRoute } from "@test/index";

export default defineRoute(({ PATCH, DELETE }) => [
  PATCH<{
    json: {
      role: "admin" | "member" | "viewer";
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
