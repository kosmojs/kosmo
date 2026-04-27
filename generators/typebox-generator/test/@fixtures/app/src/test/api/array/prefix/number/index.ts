import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Basic number tuples
      rangeTuple: VRefine<
        [number, number],
        {
          prefixItems: [
            { type: "number"; minimum: 0 },
            { type: "number"; maximum: 100 },
          ];
        }
      >;
      valueTuple: VRefine<
        [number, number, number],
        {
          prefixItems: [
            { type: "number"; const: 1 },
            { type: "number"; const: 2 },
            { type: "number"; const: 3 },
          ];
        }
      >;

      // Number tuples with complex constraints
      complexTuple: VRefine<
        [number, number, number],
        {
          prefixItems: [
            { type: "number"; exclusiveMinimum: 0 },
            { type: "number"; multipleOf: 5 },
            { type: "number"; minimum: 10; maximum: 20 },
          ];
        }
      >;

      // Decimal precision
      decimalTuple: VRefine<
        [number, number],
        {
          prefixItems: [
            { type: "number"; minimum: 0.0; maximum: 1.0 },
            { type: "number"; multipleOf: 0.25 },
          ];
        }
      >;
    };
  }>(async () => {}),
]);
