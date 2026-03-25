import { defineRoute } from "@test/index";

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
      shippingAddress: {
        street: VRefine<string, { minLength: 1; maxLength: 100 }>;
        city: string;
        state: VRefine<string, { minLength: 2; maxLength: 2 }>;
        zipCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
        country: string;
      };
      paymentMethod: "credit_card" | "paypal" | "apple_pay";
      promoCode?: string;
    };
  }>(async () => {}),
]);
