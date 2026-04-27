import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        query: VRefine<string, { minLength: 1; maxLength: 100 }>;
        results: unknown[];
        pagination: {
          page: VRefine<number, { minimum: 1 }>;
          limit: VRefine<number, { minimum: 1; maximum: 100 }>;
          total: VRefine<number, { minimum: 0 }>;
          totalPages: VRefine<number, { minimum: 0 }>;
          hasNext: boolean;
          hasPrev: boolean;
        };
        filters: {
          applied: Record<string, unknown>;
          available: {
            categories: Array<{
              name: string;
              count: VRefine<number, { minimum: 0 }>;
            }>;
            priceRanges: Array<{
              min: VRefine<number, { minimum: 0 }>;
              max: VRefine<number, { minimum: 0 }>;
              count: VRefine<number, { minimum: 0 }>;
            }>;
            ratings: Array<{
              rating: VRefine<number, { minimum: 1; maximum: 5 }>;
              count: VRefine<number, { minimum: 0 }>;
            }>;
          };
        };
        processingTime: VRefine<number, { minimum: 0 }>;
      },
    ];
  }>(async () => {}),
]);
