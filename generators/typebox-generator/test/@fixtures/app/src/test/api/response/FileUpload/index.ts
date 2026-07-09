import { defineRoute } from "@test/index";
import type { FileMetadata } from "~/types/upload";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        fileId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        fileName: VRefine<string, { minLength: 1; maxLength: 255 }>;
        fileUrl: VRefine<string, { format: "url" }>;
        fileSize: VRefine<number, { minimum: 1; maximum: 5368709120 }>;
        mimeType: VRefine<string, { pattern: "^[a-z]+/[a-z0-9.+-]+$" }>;
        uploadStatus: "success" | "processing" | "failed";
        uploadedAt: Date; // Date instance (from ORM)
        expiresAt?: string; // String (from DB)
        thumbnailUrl?: VRefine<string, { format: "url" }>;
        metadata: FileMetadata;
      },
    ];
  }>(async () => {}),
]);
