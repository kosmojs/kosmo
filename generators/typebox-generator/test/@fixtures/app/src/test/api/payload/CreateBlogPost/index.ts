import { defineRoute } from "@test/index";
import type { CreateBlogPostInput } from "@/types/blog";

export default defineRoute(({ POST }) => [
  POST<{
    json: CreateBlogPostInput;
  }>(async () => {}),
]);
