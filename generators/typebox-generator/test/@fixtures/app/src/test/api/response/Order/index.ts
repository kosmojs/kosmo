import { defineRoute } from "@test/index";
import type { OrderShippingAddress } from "~/types/order";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        orderId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        status:
          | "pending"
          | "confirmed"
          | "processing"
          | "shipped"
          | "delivered";
        totalAmount: VRefine<number, { minimum: 0; maximum: 1000000 }>;
        currency: VRefine<string, { pattern: "^[A-Z]{3}$" }>;
        estimatedDelivery?: VRefine<string, { format: "date-time" }>; // String (from DB)
        items: Array<{
          productId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
          productName: string;
          quantity: VRefine<number, { minimum: 1; maximum: 100 }>;
          unitPrice: number;
          subtotal: number;
        }>;
        shippingAddress: OrderShippingAddress;
        paymentStatus: "pending" | "paid" | "failed";
      },
    ];
  }>(async () => {}),
]);
