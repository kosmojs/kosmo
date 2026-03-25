import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      // String length constraints
      minLength: VRefine<string, { minLength: 5 }>;
      maxLength: VRefine<string, { maxLength: 10 }>;
      minMaxLength: VRefine<string, { minLength: 3; maxLength: 20 }>;

      // String pattern
      alphanumeric: VRefine<string, { pattern: "^[a-zA-Z0-9]+$" }>;
      hexColor: VRefine<
        string,
        { pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$" }
      >;

      // String formats
      email: VRefine<string, { format: "email" }>;
      date: VRefine<string, { format: "date" }>;
      dateTime: VRefine<string, { format: "date-time" }>;
      time: VRefine<string, { format: "time" }>;
      uri: VRefine<string, { format: "uri" }>;
      url: VRefine<string, { format: "url" }>;
      uuid: VRefine<string, { format: "uuid" }>;
      ipv4: VRefine<string, { format: "ipv4" }>;
      ipv6: VRefine<string, { format: "ipv6" }>;
      hostname: VRefine<string, { format: "hostname" }>;
    };
  }>(async () => {}),
]);
