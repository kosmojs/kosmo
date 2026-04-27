import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      action: string;
      repository: {
        full_name: string;
      };
      sender: {
        login: string;
      };
    };
    headers: {
      "x-hub-signature-256": string;
      "x-github-event": string;
    };
  }>(async (ctx) => {}),
]);
