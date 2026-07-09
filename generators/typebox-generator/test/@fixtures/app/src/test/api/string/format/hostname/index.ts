import { defineRoute } from "@test/index";

type HostnameBody = {
  value: VRefine<string, { format: "hostname" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: HostnameBody;
  }>(async () => {}),
]);
