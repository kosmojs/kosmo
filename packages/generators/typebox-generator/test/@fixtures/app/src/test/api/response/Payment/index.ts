import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        paymentId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        orderId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        status: "succeeded" | "pending" | "failed" | "refunded";
        amount: VRefine<number, { minimum: 0.01; maximum: 1000000 }>;
        currency: VRefine<string, { pattern: "^[A-Z]{3}$" }>;
        paymentMethod: {
          type: string;
          last4?: VRefine<string, { pattern: "^[0-9]{4}$" }>;
          brand?: string;
        };
        processedAt: string; // String (from DB)
        failureReason?: string | undefined;
        nextAction?:
          | {
              type: "redirect" | "3d_secure" | "wait";
              url?: VRefine<string, { format: "url" }>;
            }
          | undefined;
      },
    ];
  }>(async () => {}),
]);
