import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      orderId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
      amount: VRefine<number, { minimum: 0.01; maximum: 1000000 }>;
      currency: VRefine<string, { pattern: "^[A-Z]{3}$" }>;
      paymentMethod: {
        type: "card" | "wallet";
        card?: {
          number: VRefine<string, { pattern: "^[0-9]{13,19}$" }>;
          expMonth: VRefine<number, { minimum: 1; maximum: 12 }>;
          expYear: number;
          cvc: VRefine<string, { pattern: "^[0-9]{3,4}$" }>;
          holderName: string;
        };
        wallet?: {
          walletId: string;
          token: VRefine<string, { minLength: 1; maxLength: 500 }>;
        };
      };
      billingAddress: {
        line1: VRefine<string, { minLength: 1; maxLength: 100 }>;
        line2?: string;
        city: string;
        state: VRefine<string, { minLength: 2; maxLength: 2 }>;
        postalCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
        country: string;
      };
    };
  }>(async () => {}),
]);
