import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Array length constraints
      minItems: VRefine<Array<unknown>, { minItems: 1 }>;
      maxItems: VRefine<Array<unknown>, { maxItems: 5 }>;
      minMaxItems: VRefine<Array<unknown>, { minItems: 2; maxItems: 10 }>;

      // Unique items
      uniqueItems: VRefine<Array<number>, { uniqueItems: true }>;
      uniqueStrings: VRefine<Array<string>, { uniqueItems: true }>;

      // Contains validation
      containsNumber: VRefine<Array<unknown>, { contains: { type: "number" } }>;
      containsPositive: VRefine<Array<number>, { contains: { minimum: 0 } }>;

      // Array with typed items
      numberArray: VRefine<Array<number>, { minItems: 1; maxItems: 10 }>;
      stringArray: VRefine<Array<string>, { minItems: 2; uniqueItems: true }>;

      // Complex arrays
      objectArray: VRefine<
        Array<{ id: string; value: number }>,
        { minItems: 1 }
      >;
    };
  }>(async () => {}),
]);
