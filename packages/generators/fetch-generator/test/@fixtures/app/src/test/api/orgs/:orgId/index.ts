import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PATCH, DELETE }) => [
  GET(async (ctx) => {}),

  PATCH<{
    json: {
      name?: string;
      logo?: string;
      settings?: {
        defaultRole: "viewer" | "editor" | "admin";
        ssoEnabled: boolean;
      };
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
