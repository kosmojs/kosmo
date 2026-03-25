import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        id: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        name: VRefine<string, { minLength: 1; maxLength: 100 }>;
        key: VRefine<string, { minLength: 10; maxLength: 100 }>;
        prefix: VRefine<string, { minLength: 1; maxLength: 20 }>;
        permissions: string[];
        createdAt: Date; // Date instance (from ORM)
        expiresAt?: string; // String (from DB)
        lastUsed?: Date; // Date instance (from ORM)
        rateLimit: VRefine<number, { minimum: 1; maximum: 10000 }>;
        allowedIps: VRefine<
          Array<VRefine<string, { format: "ipv4" }>>,
          { minItems: 1 }
        >;
        allowedOrigins: string[];
      },
    ];
  }>(async () => {}),
]);
