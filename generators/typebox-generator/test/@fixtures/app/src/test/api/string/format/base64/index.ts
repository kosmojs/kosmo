import { defineRoute } from "@test/index";

type Base64Body = {
  value: VRefine<string, { format: "base64" }>;
};

export default defineRoute(({ POST }) => [
  POST<{
    json: Base64Body;
  }>(async () => {}),
]);
