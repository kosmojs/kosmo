export type ShippingAddress = {
  street: VRefine<string, { minLength: 1; maxLength: 100 }>;
  city: string;
  state: VRefine<string, { minLength: 2; maxLength: 2 }>;
  zipCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
  country: string;
};
