import { defineRoute } from "@test/index";

type IpCidrBody = {
  value: VRefine<
    string,
    {
      pattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$";
    }
  >;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: IpCidrBody;
  }>(async () => {}),
]);
