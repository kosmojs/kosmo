import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: VRefine<string, { format: "date" }>;
      phoneNumber?: VRefine<string, { pattern: "^\\+?[1-9][0-9]{4,14}$" }>;
      avatar?: string;
      preferences?: {
        newsletter: boolean;
        notifications: {
          email: boolean;
          sms: boolean;
          push: boolean;
        };
        theme: "light" | "dark" | "auto";
      };
      addresses?: Array<{
        type: "home" | "work" | "billing";
        street: VRefine<string, { minLength: 1; maxLength: 100 }>;
        city: string;
        state: VRefine<string, { minLength: 2; maxLength: 2 }>;
        zipCode: VRefine<string, { pattern: "^[0-9]{5}(-[0-9]{4})?$" }>;
        country: string;
        isDefault: boolean;
      }>;
    };
  }>(async () => {}),
]);
