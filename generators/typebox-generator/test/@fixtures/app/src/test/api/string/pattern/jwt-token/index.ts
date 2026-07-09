import { defineRoute } from "@test/index";

type JwtTokenBody = {
  value: VRefine<
    string,
    { pattern: "^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$" }
  >;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: JwtTokenBody;
  }>(async () => {}),
]);
