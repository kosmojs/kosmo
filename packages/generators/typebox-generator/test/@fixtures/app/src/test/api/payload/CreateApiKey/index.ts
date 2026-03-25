import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      name: VRefine<string, { minLength: 1; maxLength: 100 }>;
      permissions: Array<"read" | "write" | "delete" | "admin">;
      expiresAt?: VRefine<string, { format: "date-time" }>;
      rateLimit?: VRefine<number, { minimum: 1; maximum: 10000 }>;
      allowedIps?: string[];
      allowedOrigins?: string[];
    };
  }>(async () => {}),
]);
