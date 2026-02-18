import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      email: string;
    };
  }>(async (ctx) => {}),
]);
