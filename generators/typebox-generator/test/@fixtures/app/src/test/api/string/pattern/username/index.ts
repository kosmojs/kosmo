import { defineRoute } from "@test/index";
import type { UsernameValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: UsernameValue;
    };
  }>(async () => {}),
]);
