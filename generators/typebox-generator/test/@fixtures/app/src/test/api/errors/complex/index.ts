import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // User registration with multiple constraints
      userRegistration: {
        username: VRefine<
          string,
          { minLength: 3; maxLength: 20; pattern: "^[a-zA-Z0-9_]+$" }
        >;
        email: VRefine<string, { format: "email" }>;
        password: VRefine<
          string,
          { minLength: 8; pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)" }
        >;
        age: VRefine<number, { minimum: 13; maximum: 120 }>;
        roles: VRefine<
          Array<string>,
          {
            minItems: 1;
            uniqueItems: true;
            items: { enum: ["user", "admin", "moderator"] };
          }
        >;
      };

      // Pagination with constraints
      pagination: {
        page: VRefine<number, { minimum: 1 }>;
        pageSize: VRefine<number, { minimum: 1; maximum: 100 }>;
        sortBy?: VRefine<string, { enum: ["name", "date", "price"] }>;
        sortOrder?: VRefine<string, { enum: ["asc", "desc"] }>;
      };

      // Product with nested validation
      product: {
        id: VRefine<string, { format: "uuid" }>;
        name: VRefine<string, { minLength: 1; maxLength: 100 }>;
        price: VRefine<number, { minimum: 0; multipleOf: 0.01 }>;
        tags: VRefine<
          Array<string>,
          { minItems: 1; maxItems: 10; uniqueItems: true }
        >;
        dimensions: {
          width: VRefine<number, { minimum: 0 }>;
          height: VRefine<number, { minimum: 0 }>;
          depth: VRefine<number, { minimum: 0 }>;
        };
        metadata: VRefine<Record<string, string>, { maxProperties: 20 }>;
      };
    };
  }>(async () => {}),
]);
