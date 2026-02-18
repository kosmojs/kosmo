import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PUT }) => [
  GET(async (ctx) => {}),

  PUT<{
    json: {
      notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
      privacy?: {
        profileVisible: boolean;
        showEmail: boolean;
      };
      theme?: "light" | "dark" | "system";
    };
  }>(async (ctx) => {}),
]);
