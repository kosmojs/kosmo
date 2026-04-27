import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      name: string;
      email: string;
      subject: string;
      message: string;
      honeypot?: string;
    };
  }>(async (ctx) => {}),
]);
