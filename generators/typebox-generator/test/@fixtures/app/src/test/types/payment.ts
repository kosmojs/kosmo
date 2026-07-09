export type PaymentMethodInfo = {
  type: string;
  last4?: VRefine<string, { pattern: "^[0-9]{4}$" }>;
  brand?: string;
};
