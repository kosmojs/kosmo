import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      billingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      paymentMethod: "card" | "paypal" | "bank_transfer";
      couponCode?: string;
      notes?: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
