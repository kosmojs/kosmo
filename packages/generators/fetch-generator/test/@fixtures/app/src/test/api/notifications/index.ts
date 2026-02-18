import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PATCH }) => [
  GET<{
    query: {
      unreadOnly?: boolean;
      type?: "mention" | "reply" | "system" | "follow";
      limit?: number;
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
