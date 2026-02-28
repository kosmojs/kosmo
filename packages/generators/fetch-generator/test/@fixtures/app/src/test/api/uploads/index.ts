import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      file: File;
      folder?: string;
      description?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
