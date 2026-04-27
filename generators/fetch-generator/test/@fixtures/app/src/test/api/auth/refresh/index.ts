import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      refreshToken: string;
    };
  }>(async (ctx) => {}),
]);
