import { defineRoute } from "@test/index";
import type { PhoneNumberValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: PhoneNumberValue;
    };
  }>(async () => {}),
]);
