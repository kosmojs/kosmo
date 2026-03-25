import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Basic range validation
      minMax: VRefine<number, { minimum: 0; maximum: 100 }>;

      // Exclusive bounds
      exclusiveMin: VRefine<number, { exclusiveMinimum: 0 }>;
      exclusiveMax: VRefine<number, { exclusiveMaximum: 100 }>;

      // Combined exclusive bounds
      exclusiveRange: VRefine<
        number,
        { exclusiveMinimum: 0; exclusiveMaximum: 100 }
      >;

      // Multiple of constraint
      multipleOfFive: VRefine<number, { multipleOf: 5 }>;

      // Mixed constraints
      complexConstraint: VRefine<
        number,
        {
          minimum: 10;
          maximum: 50;
          multipleOf: 2;
        }
      >;

      // Negative ranges
      negativeRange: VRefine<number, { minimum: -100; maximum: -10 }>;

      // Decimal constraints
      decimalRange: VRefine<number, { minimum: 0.1; maximum: 1.0 }>;

      // Integer constraints with multipleOf
      integerMultiple: VRefine<number, { multipleOf: 1 }>; // Forces integers

      // Zero boundary
      positiveOnly: VRefine<number, { minimum: 0 }>;
      negativeOnly: VRefine<number, { maximum: 0 }>;
    };
  }>(async () => {}),
]);
