import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    raw: string | Buffer;
  }>(async () => {}),
]);
