import { defineRoute } from "@test/index";
import type { ApiKeyResponse } from "~/types/apikey";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      ApiKeyResponse,
    ];
  }>(async () => {}),
]);
