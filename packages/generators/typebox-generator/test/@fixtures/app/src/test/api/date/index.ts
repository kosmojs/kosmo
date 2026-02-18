import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      date: Date;
    };
  }>(async () => {}),
]);
