import { defineRoute } from "@test/index";

type DateTimeBody = {
  value: VRefine<string, { format: "date-time" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: DateTimeBody;
  }>(async () => {}),
]);
