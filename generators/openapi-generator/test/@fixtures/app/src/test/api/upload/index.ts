import { defineRoute } from "@test/index";

type UploadResponse = {
  success: boolean;
  message: string;
};

export default defineRoute(({ POST }) => [
  POST<{
    raw: Buffer,
    response: [200, "json", UploadResponse]
  }, { raw: { contentType: "png" } }>(async (ctx) => {
    ctx.body = {
      success: true,
      message: "Files uploaded without payload validation",
    };
  }),
]);
