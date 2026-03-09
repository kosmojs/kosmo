import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    form: {
      file: File;
      type: "users" | "products" | "orders";
      overwrite?: "true";
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
