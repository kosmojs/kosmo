import { defineRoute } from "@test/index";
import type { PaymentMethodInfo } from "~/types/payment";

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
        paymentMethod: PaymentMethodInfo;
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
