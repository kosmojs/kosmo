export type UserPreferences = {
  newsletter: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: "light" | "dark" | "auto";
};
