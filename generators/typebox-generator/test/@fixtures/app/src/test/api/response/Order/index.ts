import { defineRoute } from "@test/index";

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
        shippingAddress: {
          street: VRefine<string, { minLength: 1; maxLength: 100 }>;
          city: string;
          state: VRefine<string, { minLength: 2; maxLength: 2 }>;
          zipCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
          country: string;
        };
        paymentStatus: "pending" | "paid" | "failed";
      },
    ];
  }>(async () => {}),
]);
