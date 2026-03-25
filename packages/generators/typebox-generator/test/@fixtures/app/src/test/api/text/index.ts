import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    raw: string;
  }>(async () => {}),

  POST<{
    raw: VRefine<string, { minLength: 5 }>;
  }>(async () => {}),
]);
