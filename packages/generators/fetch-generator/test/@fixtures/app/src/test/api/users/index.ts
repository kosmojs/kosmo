import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      page?:  string;
      limit?: string;
      search?: string;
      role?: "admin" | "user" | "moderator";
      sortBy?: "name" | "createdAt" | "email";
      order?: "asc" | "desc";
    };
  }>(async (ctx) => {}),
]);
