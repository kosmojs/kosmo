import { defineRoute } from "@test/index";
import type { CreateApiKeyInput } from "@/types/apikey";

export default defineRoute(({ POST }) => [
  POST<{
    json: CreateApiKeyInput;
  }>(async () => {}),
]);
