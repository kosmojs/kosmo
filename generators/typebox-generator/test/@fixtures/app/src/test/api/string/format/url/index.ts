import { defineRoute } from "@test/index";
import type { UrlValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: UrlValue;
    };
  }>(async () => {}),
]);
