import { defineRoute } from "@test/index";
import type { SlugValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: SlugValue;
    };
  }>(async () => {}),
]);
