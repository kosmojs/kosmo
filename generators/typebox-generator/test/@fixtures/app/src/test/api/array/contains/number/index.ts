import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Basic number contains
      valueContains: VRefine<
        number[],
        {
          contains: { type: "number"; const: 42 };
        }
      >;
      rangeContains: VRefine<
        number[],
        {
          contains: { type: "number"; minimum: 10; maximum: 20 };
        }
      >;
      multipleContains: VRefine<
        number[],
        {
          contains: { type: "number"; multipleOf: 5 };
        }
      >;

      // Number contains with min/max
      minContains: VRefine<
        number[],
        {
          contains: { type: "number"; minimum: 100 };
          minContains: 2;
        }
      >;
      maxContains: VRefine<
        number[],
        {
          contains: { type: "number"; maximum: 0 };
          maxContains: 1;
        }
      >;
      minMaxContains: VRefine<
        number[],
        {
          contains: { type: "number"; minimum: 50; maximum: 100 };
          minContains: 1;
          maxContains: 3;
        }
      >;

      // Complex number constraints
      exclusiveContains: VRefine<
        number[],
        {
          contains: {
            type: "number";
            exclusiveMinimum: 0;
            exclusiveMaximum: 100;
          };
        }
      >;
      integerContains: VRefine<
        number[],
        {
          contains: {
            type: "number";
            multipleOf: 1; // Forces integer
          };
        }
      >;
    };
  }>(async () => {}),
]);
