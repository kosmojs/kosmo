import { defineRoute } from "@test/index";
import type { ShippingAddress } from "@/types/order";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      userId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
      items: Array<{
        productId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        quantity: VRefine<number, { minimum: 1; maximum: 100 }>;
        price: number;
        variants?: {
          size?: string;
          color?: VRefine<string, { maxLength: 20 }>;
          material?: string;
        };
      }>;
      shippingAddress: ShippingAddress;
      paymentMethod: "credit_card" | "paypal" | "apple_pay";
      promoCode?: string;
    };
  }>(async () => {}),
]);
