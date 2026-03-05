import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      role?: "owner" | "admin" | "member" | "viewer";
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      email: string;
      role: "admin" | "member" | "viewer";
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
