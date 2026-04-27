import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    raw: Blob;
  }>(async () => {}),

  POST<{
    raw: ArrayBuffer;
  }>(async () => {}),
]);
