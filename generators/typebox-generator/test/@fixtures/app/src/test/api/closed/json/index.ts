import { defineRoute } from "@test/index";
import type { ClosedJson, OpenQuery } from "@/types/closed";

export default defineRoute(({ POST }) => [
  POST<{
    json: ClosedJson;
    query: OpenQuery;
  }>(async () => {}),
]);
