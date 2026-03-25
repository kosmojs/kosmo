import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Minimum/Maximum
      minimum: VRefine<number, { minimum: 0 }>;
      maximum: VRefine<number, { maximum: 100 }>;
      minMax: VRefine<number, { minimum: 10; maximum: 90 }>;

      // Exclusive bounds
      exclusiveMinimum: VRefine<number, { exclusiveMinimum: 0 }>;
      exclusiveMaximum: VRefine<number, { exclusiveMaximum: 100 }>;
      exclusiveRange: VRefine<
        number,
        { exclusiveMinimum: 0; exclusiveMaximum: 100 }
      >;

      // Multiple of
      multipleOf5: VRefine<number, { multipleOf: 5 }>;
      multipleOfDecimal: VRefine<number, { multipleOf: 0.25 }>;

      // Combined constraints
      positiveMultiple: VRefine<number, { minimum: 0; multipleOf: 10 }>;
      negativeOnly: VRefine<number, { maximum: 0 }>;
    };
  }>(async () => {}),
]);
