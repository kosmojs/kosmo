import { defineRoute } from "@test/index";

export default defineRoute<
  "params/{...path}",
  [Array<"a" | "b" | "c">]
>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
