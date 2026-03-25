import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        id: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        title: VRefine<string, { minLength: 1; maxLength: 200 }>;
        content: string;
        excerpt: string;
        author: {
          id: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
          name: string;
          avatar?: string;
        };
        tags: string[];
        category: VRefine<string, { minLength: 1; maxLength: 50 }>;
        status: "draft" | "published" | "scheduled";
        publishedAt?: Date; // Date instance (from ORM)
        createdAt: string; // String (from DB)
        updatedAt: string; // String (from DB)
        readTime: VRefine<number, { minimum: 1; maximum: 480 }>; // 8 hours max
        viewCount: VRefine<number, { minimum: 0 }>;
      },
    ];
  }>(async () => {}),
]);
