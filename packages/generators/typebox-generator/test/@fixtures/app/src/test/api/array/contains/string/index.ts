import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Basic string contains
      constContains: VRefine<
        string[],
        {
          contains: { type: "string"; const: "admin" };
        }
      >;
      patternContains: VRefine<
        string[],
        {
          contains: { type: "string"; pattern: "^VIP" };
        }
      >;
      enumContains: VRefine<
        string[],
        {
          contains: {
            type: "string";
            enum: ["active", "pending", "completed"];
          };
        }
      >;

      // String contains with min/max
      minContains: VRefine<
        string[],
        {
          contains: { type: "string"; const: "gold" };
          minContains: 2;
        }
      >;
      maxContains: VRefine<
        string[],
        {
          contains: { type: "string"; const: "silver" };
          maxContains: 3;
        }
      >;
      minMaxContains: VRefine<
        string[],
        {
          contains: { type: "string"; const: "premium" };
          minContains: 1;
          maxContains: 2;
        }
      >;

      // Complex string patterns
      multiConstraintContains: VRefine<
        string[],
        {
          contains: {
            type: "string";
            minLength: 3;
            maxLength: 6;
            pattern: "^[A-Z]";
          };
        }
      >;
      emailContains: VRefine<
        string[],
        {
          contains: {
            type: "string";
            format: "email";
          };
        }
      >;
    };
  }>(async () => {}),
]);
