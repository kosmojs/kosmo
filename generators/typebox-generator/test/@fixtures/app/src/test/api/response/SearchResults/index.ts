import { defineRoute } from "@test/index";
import type { SearchResultsResponse } from "~/types/search";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      SearchResultsResponse,
    ];
  }>(async () => {}),
]);
