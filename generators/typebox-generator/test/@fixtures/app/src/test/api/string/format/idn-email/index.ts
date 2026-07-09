import { defineRoute } from "@test/index";

type IdnEmailBody = {
  value: VRefine<string, { format: "idn-email" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: IdnEmailBody;
  }>(async () => {}),
]);
