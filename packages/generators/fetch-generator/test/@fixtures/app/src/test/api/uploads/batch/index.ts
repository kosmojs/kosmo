import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      files: File[];
      folder?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
