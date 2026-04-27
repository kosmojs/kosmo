import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PATCH }) => [
  GET<{
    query: {
      unreadOnly?: string;
      type?: "mention" | "reply" | "system" | "follow";
      limit?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),

  PATCH<{
    json: {
      markAllRead: boolean;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
