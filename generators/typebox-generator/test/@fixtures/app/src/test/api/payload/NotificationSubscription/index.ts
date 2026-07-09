import { defineRoute } from "@test/index";
import type { NotificationSubscriptionInput } from "@/types/notification";

export default defineRoute(({ POST }) => [
  POST<{
    json: NotificationSubscriptionInput;
  }>(async () => {}),
]);
