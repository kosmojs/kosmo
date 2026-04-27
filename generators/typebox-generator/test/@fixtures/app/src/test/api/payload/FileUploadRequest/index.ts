import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      fileName: VRefine<string, { minLength: 1; maxLength: 255 }>;
      fileSize: VRefine<number, { minimum: 1; maximum: 5368709120 }>;
      mimeType: VRefine<string, { pattern: "^[a-z]+/[a-z0-9.+-]+$" }>;
      description?: string;
      tags?: string[];
      isPublic: boolean;
      expiresAt?: string;
    };
  }>(async () => {}),
]);
