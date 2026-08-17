import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "Fetch",
    slot: "fetch",
  },
  factory,
});
