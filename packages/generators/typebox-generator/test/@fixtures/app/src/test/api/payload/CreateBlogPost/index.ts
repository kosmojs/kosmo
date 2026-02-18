import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      title: TRefine<string, { minLength: 1; maxLength: 200 }>;
      content: string;
      excerpt?: string;
      tags: string[];
      category: TRefine<string, { minLength: 1; maxLength: 50 }>;
      isPublished: boolean;
      scheduledPublishAt?: TRefine<string, { format: "date-time" }>;
      metaDescription?: TRefine<string, { maxLength: 160 }>;
      featuredImage?: string;
    };
  }>(async () => {}),
]);
