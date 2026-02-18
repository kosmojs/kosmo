import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: string;
      password: string;
      name: string;
      acceptTerms: boolean;
    };
  }>(async (ctx) => {}),
]);
