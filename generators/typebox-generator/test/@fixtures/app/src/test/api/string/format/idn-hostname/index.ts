import { defineRoute } from "@test/index";

type IdnHostnameBody = {
  value: VRefine<string, { format: "idn-hostname" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: IdnHostnameBody;
  }>(async () => {}),
]);
