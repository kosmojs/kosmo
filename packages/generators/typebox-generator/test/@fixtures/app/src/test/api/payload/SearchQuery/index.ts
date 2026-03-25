import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      query: VRefine<string, { minLength: 1; maxLength: 100 }>;
      filters: {
        category?: string[];
        priceRange?: {
          min?: VRefine<number, { minimum: 0 }>;
          max?: number;
        };
        rating?: VRefine<number, { minimum: 1; maximum: 5 }>;
        inStock?: boolean;
        attributes?: Record<string, string | number>;
      };
      pagination: {
        page: VRefine<number, { minimum: 1 }>;
        limit: VRefine<number, { minimum: 1; maximum: 100 }>;
        sortBy: "relevance" | "price" | "rating" | "newest";
        sortOrder: "asc" | "desc";
      };
    };
  }>(async () => {}),
]);
