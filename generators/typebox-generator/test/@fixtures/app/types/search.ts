export type SearchPagination = {
  page: VRefine<number, { minimum: 1 }>;
  limit: VRefine<number, { minimum: 1; maximum: 100 }>;
  sortBy: "relevance" | "price" | "rating" | "newest";
  sortOrder: "asc" | "desc";
};
