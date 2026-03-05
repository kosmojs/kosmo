import { defineRoute } from "@test/index";

type CodeDetails = {
  type: "promo" | "discount" | "referral";
  discount: number;
  validUntil: string;
  usageLimit: number;
};

type CodeResponse = {
  code: string;
  valid: boolean;
  details: CodeDetails;
};

type CodeQuery = {
  validateOnly?: boolean;
  includeUsage?: boolean;
};

export default defineRoute<[TRefine<string, { pattern: "^[A-Z0-9]{3,10}$" }>]>(
  ({ GET }) => [
    GET<{ json: CodeQuery; response: [200, "json", CodeResponse] }>(
      async (ctx) => {
        ctx.body = {
          code: ctx.params.code,
          valid: true,
          details: {
            type: "promo",
            discount: 10,
            validUntil: "2024-12-31T23:59:59Z",
            usageLimit: 100,
          },
        };
      },
    ),
  ],
);
