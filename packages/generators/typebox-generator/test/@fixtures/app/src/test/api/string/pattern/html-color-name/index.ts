import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      value: TRefine<
        string,
        {
          pattern: "^(red|green|blue|yellow|purple|orange|pink|black|white|gray|grey|brown|cyan|magenta|silver|maroon|olive|lime|teal|navy)$";
        }
      >;
    };
  }>(async () => {}),
]);
