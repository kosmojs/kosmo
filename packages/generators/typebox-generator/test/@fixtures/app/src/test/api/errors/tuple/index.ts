import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Fixed-length tuples with specific types
      stringNumberTuple: [string, number];
      booleanStringTuple: [boolean, string];

      // Tuples with constraints
      minLengthTuple: VRefine<[string, number], { minItems: 2 }>;
      maxLengthTuple: VRefine<[string, number, boolean], { maxItems: 3 }>;

      // Tuples with refined elements
      emailAgeTuple: [
        VRefine<string, { format: "email" }>,
        VRefine<number, { minimum: 0; maximum: 120 }>,
      ];

      // Tuple with const values
      configTuple: [
        VRefine<string, { const: "config" }>,
        VRefine<number, { minimum: 1 }>,
      ];
      rangeTuple: [
        VRefine<number, { minimum: 0 }>,
        VRefine<number, { maximum: 100 }>,
      ];
    };
  }>(async () => {}),
]);
