export type HexColorValue = VRefine<string, { pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$" }>;
