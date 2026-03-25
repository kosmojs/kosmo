import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Required properties
      requiredProps: {
        id: string;
        name: string;
        email: VRefine<string, { format: "email" }>;
      };

      // Optional properties
      optionalProps: {
        id: string;
        description?: string;
      };

      // Additional properties constraint
      noAdditionalProps: VRefine<
        { id: string; name: string },
        { additionalProperties: false }
      >;

      // Property count constraints
      minProperties: VRefine<Record<string, unknown>, { minProperties: 2 }>;
      maxProperties: VRefine<Record<string, unknown>, { maxProperties: 5 }>;

      // Nested objects
      nestedObject: {
        user: {
          profile: {
            name: string;
            settings: {
              theme: VRefine<string, { enum: ["light", "dark"] }>;
              notifications: boolean;
            };
          };
        };
      };

      // Object with specific property names
      dynamicKeys: VRefine<
        Record<string, number>,
        { propertyNames: { pattern: "^[a-z]+$" } }
      >;
    };
  }>(async () => {}),
]);
