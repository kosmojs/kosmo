import { defineRoute } from "@test/index";

type MacAddressBody = {
  value: VRefine<
    string,
    { pattern: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$" }
  >;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: MacAddressBody;
  }>(async () => {}),
]);
