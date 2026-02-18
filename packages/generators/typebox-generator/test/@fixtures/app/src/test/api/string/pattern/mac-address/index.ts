import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<
        string,
        { pattern: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$" }
      >;
    };
  }>(async () => {}),
]);
