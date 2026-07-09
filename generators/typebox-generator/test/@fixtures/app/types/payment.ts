export type BillingAddress = {
  line1: VRefine<string, { minLength: 1; maxLength: 100 }>;
  line2?: string;
  city: string;
  state: VRefine<string, { minLength: 2; maxLength: 2 }>;
  postalCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
  country: string;
};
