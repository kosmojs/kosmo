import { defineRoute } from "@test/index";

export default defineRoute(({ GET }) => [
  GET<{
    query: {
      q?: string;
      category?: string;
      minPrice?: string;
      maxPrice?: string;
      inStock?:  string;
      sort?: "price-asc" | "price-desc" | "newest" | "rating";
      page?:  string;
      limit?: string;
    };
  }>(async (ctx) => {}),
]);
