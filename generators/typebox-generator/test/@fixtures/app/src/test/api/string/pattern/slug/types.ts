export type SlugValue = VRefine<string, { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }>;
