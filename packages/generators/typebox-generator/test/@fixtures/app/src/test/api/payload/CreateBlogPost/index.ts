import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      title: VRefine<string, { minLength: 1; maxLength: 200 }>;
      content: string;
      excerpt?: string;
      tags: string[];
      category: VRefine<string, { minLength: 1; maxLength: 50 }>;
      isPublished: boolean;
      scheduledPublishAt?: VRefine<string, { format: "date-time" }>;
      metaDescription?: VRefine<string, { maxLength: 160 }>;
      featuredImage?: string;
    };
  }>(async () => {}),
]);
