import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: string;
      password: string;
    };
    headers: {
      "x-device-id": string;
    };
  }>(async (ctx) => {}),
]);
