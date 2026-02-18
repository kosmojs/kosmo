import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    multipart: {
      file: File;
      cropX?: number;
      cropY?: number;
      cropSize?: number;
    };
  }>(async (ctx) => {}),
]);
