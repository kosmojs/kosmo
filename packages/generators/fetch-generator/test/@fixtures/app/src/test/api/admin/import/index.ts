import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    multipart: {
      file: File;
      type: "users" | "products" | "orders";
      overwrite?: boolean;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
