import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // Two-variant string literal union
      schedule: "immediate" | "after_review";

      // Numeric literal union
      level: 1 | 2 | 3;

      // Literal union across primitive types
      mode: "auto" | 0 | true;

      // More than 5 variants - message falls back to generic text,
      // params still carry the full value set
      wide: "a" | "b" | "c" | "d" | "e" | "f";

      // Mixed union (literal | object) - not collapsible
      target: "none" | { id: string };
    };
  }>(async () => {}),
]);
