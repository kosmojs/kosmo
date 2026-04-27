import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      userId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
      method: "totp" | "sms" | "email";
      phoneNumber?: string;
      email?: VRefine<string, { format: "email" }>;
      backupCodes: string[];
      deviceInfo?: {
        name: VRefine<string, { minLength: 1; maxLength: 50 }>;
        type: "mobile" | "tablet" | "desktop";
        os: string;
        browser?: string;
      };
    };
  }>(async () => {}),
]);
