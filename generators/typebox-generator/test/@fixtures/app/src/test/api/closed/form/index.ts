import { defineRoute } from "@test/index";
import type { ClosedForm } from "@/types/closed";

export default defineRoute(({ POST }) => [
  POST<{
    form: ClosedForm;
  }>(async () => {}),
]);
