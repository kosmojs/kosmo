import { defineRoute } from "@test/index";

type Ipv6Body = {
  value: VRefine<string, { format: "ipv6" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: Ipv6Body;
  }>(async () => {}),
]);
