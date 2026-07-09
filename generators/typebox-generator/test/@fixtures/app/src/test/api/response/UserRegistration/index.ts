import { defineRoute } from "@test/index";
import type { UserRegistrationResponse } from "~/types/registration";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      UserRegistrationResponse,
    ];
  }>(async () => {}),
]);
