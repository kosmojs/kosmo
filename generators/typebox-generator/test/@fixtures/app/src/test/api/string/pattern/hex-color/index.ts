import { defineRoute } from "@test/index";
import type { HexColorValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: HexColorValue;
    };
  }>(async () => {}),
]);
