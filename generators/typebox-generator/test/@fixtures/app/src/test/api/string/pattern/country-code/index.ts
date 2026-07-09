import { defineRoute } from "@test/index";
import type { CountryCodeValue } from "./types";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: CountryCodeValue;
    };
  }>(async () => {}),
]);
