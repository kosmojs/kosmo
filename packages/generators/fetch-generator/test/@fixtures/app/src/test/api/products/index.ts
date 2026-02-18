import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      q?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      sort?: "price-asc" | "price-desc" | "newest" | "rating";
      page?: number;
      limit?: number;
    };
  }>(async (ctx) => {}),
]);
