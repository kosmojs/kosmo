import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      minLength: TRefine<string, { minLength: 0 }>;
      maxLength: TRefine<string, { maxLength: 5 }>;
      mixLength: TRefine<string, { minLength: 0; maxLength: 5 }>;
    };
  }>(async () => {}),
]);
