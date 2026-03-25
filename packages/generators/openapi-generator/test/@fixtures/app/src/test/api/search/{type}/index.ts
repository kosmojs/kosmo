import { defineRoute } from "@test/index";

type SearchPayload = {
  query: VRefine<string, { minLength: 1; maxLength: 100 }>;
  filters?: {
    category?: "tech" | "science" | "arts";
    dateRange?: {
      from: VRefine<string, { format: "date" }>;
      to: VRefine<string, { format: "date" }>;
    };
    tags?: VRefine<string[], { maxItems: 5 }>;
  };
  pagination?: {
    page?: VRefine<number, { minimum: 1 }>;
    limit?: VRefine<number, { minimum: 1; maximum: 100 }>;
  };
};

type SearchResult = {
  id: number;
  title: string;
  type: "post" | "user" | "comment";
  relevance: number;
  excerpt?: string;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export default defineRoute<"", ["posts" | "users" | "all"]>(({ POST }) => [
  POST<
    { json: SearchPayload; response: [200, "json", SearchResponse] },
    {
      json: {
        runtimeValidation: false;
      };
    }
  >(async (ctx) => {
    const { pagination } = await ctx.bodyparser.json<SearchPayload>()
    ctx.body = {
      results: [],
      total: 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
      hasMore: false,
    };
  }),
]);
