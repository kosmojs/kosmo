import { defineRoute } from "@test/index";
import type { Ipv4Value } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: Ipv4Value;
    };
  }>(async () => {}),
]);
