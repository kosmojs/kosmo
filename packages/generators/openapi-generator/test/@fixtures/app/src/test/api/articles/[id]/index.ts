import { defineRoute } from "@test/index";

type ArticleResponse = {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: TRefine<string, { format: "date-time" }>;
  tags: string[];
};

type ArticleQuery = {
  includeComments?: boolean;
  includeAuthor?: boolean;
  format?: "full" | "summary";
};

export default defineRoute<[TRefine<number, { minimum: 1 }>]>(({ GET }) => [
  GET<{
    form: ArticleQuery;
    response: [200, "json", ArticleResponse],
  }, {
    form: {
      contentType: "multipart/form-data",
    }
  }>(
    async (ctx) => {
      ctx.body = {
        id: Number(ctx.params.id),
        title: "Sample Article",
        content: "This is the article content",
        author: "John Writer",
        publishedAt: "2024-01-01T10:00:00Z",
        tags: ["tech", "programming"],
      };
    },
  ),
]);
