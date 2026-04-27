import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      stringMinItems: VRefine<string[], { minItems: 1 }>;
      stringMaxItems: VRefine<string[], { maxItems: 5 }>;
      stringMixedLength: VRefine<string[], { minItems: 1; maxItems: 5 }>;
      numberMinItems: VRefine<number[], { minItems: 2 }>;
      numberMaxItems: VRefine<number[], { maxItems: 10 }>;
      numberMixedLength: VRefine<number[], { minItems: 2; maxItems: 10 }>;
      booleanMinItems: VRefine<boolean[], { minItems: 1 }>;
      booleanMaxItems: VRefine<boolean[], { maxItems: 3 }>;
      uniqueStrings: VRefine<string[], { uniqueItems: true }>;
      uniqueNumbers: VRefine<number[], { uniqueItems: true }>;
      uniqueBooleans: VRefine<boolean[], { uniqueItems: true }>;
      complexLength: VRefine<
        string[],
        {
          minItems: 2;
          maxItems: 3;
          uniqueItems: true;
        }
      >;
    };
  }>(async () => {}),
]);
