export type PhoneNumberValue = VRefine<string, { pattern: "^\\+?[1-9][0-9]{4,14}$" }>;
