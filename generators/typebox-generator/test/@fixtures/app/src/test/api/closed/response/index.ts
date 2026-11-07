import { defineRoute } from "@test/index";
import type { ClosedResponse } from "@/types/closed";

export default defineRoute(({ GET }) => [
  GET<{
    response: [200, "json", ClosedResponse];
  }>(async () => {}),
]);
