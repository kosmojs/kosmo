import { defineRoute } from "@test/index";
import type { UuidValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: UuidValue;
    };
  }>(async () => {}),
]);
