import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      minLength: VRefine<string, { minLength: 0 }>;
      maxLength: VRefine<string, { maxLength: 5 }>;
      mixLength: VRefine<string, { minLength: 0; maxLength: 5 }>;
    };
  }>(async () => {}),
]);
