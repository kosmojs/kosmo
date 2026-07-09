export type UsernameValue = VRefine<string, { pattern: "^[a-zA-Z0-9_-]{3,20}$" }>;
