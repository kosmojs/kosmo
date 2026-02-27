import { defineRoute } from "@test/index";

export default defineRoute(({ GET, PATCH }) => [
  GET(async (ctx) => {}),

  PATCH<{
    json: {
      displayName?: string;
      avatar?: string;
      website?: string;
      location?: string;
      socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
    };
  }>(async (ctx) => {}),
]);
