import { defineRoute } from "@test/index";
import type { FileUploadRequestInput } from "@/types/upload";

export default defineRoute(({ POST }) => [
  POST<{
    json: FileUploadRequestInput;
  }>(async () => {}),
]);
