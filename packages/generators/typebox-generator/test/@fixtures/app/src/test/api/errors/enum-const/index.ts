import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Enum validation
      status: VRefine<
        string,
        { enum: ["pending", "active", "completed", "failed"] }
      >;
      priority: VRefine<number, { enum: [1, 2, 3, 4, 5] }>;
      booleanEnum: true | false;

      // Const validation
      version: VRefine<string, { const: "1.0.0" }>;
      apiVersion: VRefine<number, { const: 2 }>;
      enabled: true;

      // Mixed types
      mixedEnum: VRefine<string | number, { enum: ["auto", 0, 100] }>;
    };
  }>(async () => {}),
]);
