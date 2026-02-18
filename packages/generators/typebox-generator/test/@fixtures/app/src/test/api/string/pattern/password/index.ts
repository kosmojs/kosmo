import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<
        string,
        { pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$" }
      >;
    };
  }>(async () => {}),
]);
