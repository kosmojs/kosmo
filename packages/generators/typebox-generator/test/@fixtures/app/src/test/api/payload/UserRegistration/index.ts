import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: TRefine<string, { format: "email" }>;
      password: TRefine<
        string,
        { pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$" }
      >;
      firstName: string;
      lastName: string;
      dateOfBirth: TRefine<string, { format: "date" }>;
      agreeToTerms: boolean;
      marketingOptIn?: boolean;
    };
  }>(async () => {}),
]);
