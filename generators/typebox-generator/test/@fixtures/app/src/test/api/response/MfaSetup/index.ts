import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        userId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
        method: "totp" | "sms" | "email";
        status: "active" | "pending_verification";
        setupData?: {
          qrCode?: string;
          secret?: VRefine<string, { minLength: 10; maxLength: 100 }>;
          phoneNumber?: VRefine<string, { pattern: "^\\+?[1-9][0-9]{4,14}$" }>;
          email?: VRefine<string, { format: "email" }>;
        };
        backupCodes: VRefine<
          Array<VRefine<string, { pattern: "^code\\d+" }>>,
          { minItems: 1 }
        >;
        deviceInfo?: {
          name: VRefine<string, { minLength: 1; maxLength: 50 }>;
          type: string;
          os: string;
          browser?: string;
        };
        createdAt: Date; // Date instance (from ORM)
        verifiedAt?: string; // String (from DB)
      },
    ];
  }>(async () => {}),
]);
