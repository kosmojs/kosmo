import { defineRoute } from "@test/index";
import type { EmailValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: EmailValue;
    };
  }>(async () => {}),
]);
