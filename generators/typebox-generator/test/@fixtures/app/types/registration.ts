export type UserRegistrationInput = {
  email: VRefine<string, { format: "email" }>;
  password: VRefine<
    string,
    { pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$" }
  >;
  firstName: string;
  lastName: string;
  dateOfBirth: VRefine<string, { format: "date" }>;
  agreeToTerms: boolean;
  marketingOptIn?: boolean;
};
