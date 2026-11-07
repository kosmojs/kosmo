import { defineRoute } from "@test/index";
import type { ClosedIntersection } from "@/types/closed";

export default defineRoute(({ POST }) => [
  POST<{
    json: ClosedIntersection;
  }>(async () => {}),
]);
