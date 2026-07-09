import { defineRoute } from "@test/index";
import type { DeviceInfo } from "@/types/mfa";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      userId: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
      method: "totp" | "sms" | "email";
      phoneNumber?: string;
      email?: VRefine<string, { format: "email" }>;
      backupCodes: string[];
      deviceInfo?: DeviceInfo;
    };
  }>(async () => {}),
]);
