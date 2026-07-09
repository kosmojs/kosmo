import { defineRoute } from "@test/index";

type TimeBody = {
  value: VRefine<string, { format: "time" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: TimeBody;
  }>(async () => {}),
]);
