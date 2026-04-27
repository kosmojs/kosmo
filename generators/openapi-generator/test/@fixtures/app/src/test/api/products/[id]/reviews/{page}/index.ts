import { defineRoute } from "@test/index";

type CreateReviewPayload = {
  rating: VRefine<number, { minimum: 1; maximum: 5 }>;
  title: VRefine<string, { maxLength: 100 }>;
  comment: VRefine<string, { maxLength: 1000 }>;
  isAnonymous?: boolean;
};

type ReviewResponse = {
  id: number;
  rating: number;
  title?: string;
  comment: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: VRefine<string, { format: "date-time" }>;
};

type ReviewsResponse = {
  reviews: ReviewResponse[];
  averageRating: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

type ReviewsQuery = {
  sort?: "newest" | "oldest" | "highest" | "lowest";
  minRating?: VRefine<number, { minimum: 1; maximum: 5 }>;
  verifiedOnly?: boolean;
};

export default defineRoute<
  "",
  [VRefine<number, { minimum: 1 }>, VRefine<number, { minimum: 1 }>]
>(({ GET, POST }) => [
  GET<{ json: ReviewsQuery; response: [200, "json", ReviewsResponse] }>(
    async (ctx) => {
      const page = Number(ctx.params.page) || 1;
      ctx.body = {
        reviews: [],
        averageRating: 4.5,
        pagination: {
          page,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      };
    },
  ),

  POST<{ json: CreateReviewPayload; response: [200, "json", ReviewResponse] }>(
    async (ctx) => {
      const { rating, title, comment, isAnonymous } = ctx.validated.json;
      ctx.body = {
        id: 1,
        rating,
        title,
        comment,
        author: {
          id: isAnonymous ? 0 : 123,
          name: isAnonymous ? "Anonymous" : "John Doe",
        },
        createdAt: new Date().toISOString(),
      };
    },
  ),
]);
