import { defineRoute } from "@test/index";

type NotificationSettings = {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: "instant" | "daily" | "weekly";
};

type PrivacySettings = {
  profileVisibility: "public" | "private" | "friends";
  dataSharing: boolean;
  searchEngineIndexing: boolean;
};

type SettingsPayload = {
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
  language?: string;
  timezone?: string;
};

type SettingsResponse = {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
  timezone: string;
  updatedAt: TRefine<string, { format: "date-time" }>;
};

type SettingsQuery = {
  format?: "full" | "minimal";
  includeDefaults?: boolean;
};

export default defineRoute<["notifications" | "privacy" | "general"]>(
  ({ GET, PATCH }) => [
    GET<{ json: SettingsQuery; response: [200, "json", SettingsResponse] }>(
      async (ctx) => {
        ctx.body = {
          notifications: {
            email: true,
            push: false,
            sms: false,
            frequency: "instant",
          },
          privacy: {
            profileVisibility: "public",
            dataSharing: true,
            searchEngineIndexing: true,
          },
          language: "en",
          timezone: "UTC",
          updatedAt: new Date().toISOString(),
        };
      },
    ),

    PATCH<
      {
        json: SettingsPayload,
        response:[200, "json", SettingsResponse]
      },
      {
        json: {
          runtimeValidation:false
        }
      }
    >(async (ctx) => {
      const updates = await ctx.bodyparser.json<SettingsPayload>()
      ctx.body = {
        notifications: updates.notifications || {
          email: true,
          push: false,
          sms: false,
          frequency: "instant",
        },
        privacy: updates.privacy || {
          profileVisibility: "public",
          dataSharing: true,
          searchEngineIndexing: true,
        },
        language: updates.language || "en",
        timezone: updates.timezone || "UTC",
        updatedAt: new Date().toISOString(),
      };
    }),
  ],
);
