import { defineRoute } from "@test/index";
import type { NotificationSubscriptionResponse } from "~/types/notification";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      NotificationSubscriptionResponse,
    ];
  }>(async () => {}),
]);
