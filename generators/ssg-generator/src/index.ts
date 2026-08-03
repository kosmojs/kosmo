import { defineGenerator } from "@kosmojs/lib";

import factory from "./factory";

export default defineGenerator({
  meta: {
    name: "SSG",
    slot: "ssg",
  },
  factory,
});
