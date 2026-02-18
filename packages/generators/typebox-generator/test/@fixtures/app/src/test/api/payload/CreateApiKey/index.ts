import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      name: TRefine<string, { minLength: 1; maxLength: 100 }>;
      permissions: Array<"read" | "write" | "delete" | "admin">;
      expiresAt?: TRefine<string, { format: "date-time" }>;
      rateLimit?: TRefine<number, { minimum: 1; maximum: 10000 }>;
      allowedIps?: string[];
      allowedOrigins?: string[];
    };
  }>(async () => {}),
]);
