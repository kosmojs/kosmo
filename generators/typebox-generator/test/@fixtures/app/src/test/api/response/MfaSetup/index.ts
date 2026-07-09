import { defineRoute } from "@test/index";
import type { MfaSetupResponse } from "~/types/mfa";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      MfaSetupResponse,
    ];
  }>(async () => {}),
]);
