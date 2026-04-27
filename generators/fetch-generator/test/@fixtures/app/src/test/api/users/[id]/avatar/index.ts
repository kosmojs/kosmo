import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      file: File;
      cropX?:    string;
      cropY?:    string;
      cropSize?: string;
    };
  }>(async (ctx) => {}),
]);
