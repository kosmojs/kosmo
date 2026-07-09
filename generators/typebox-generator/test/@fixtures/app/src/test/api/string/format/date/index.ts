import { defineRoute } from "@test/index";
import type { DateValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: DateValue;
    };
  }>(async () => {}),
]);
