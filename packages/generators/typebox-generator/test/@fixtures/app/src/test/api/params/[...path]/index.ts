import { defineRoute } from "@test/index";

export default defineRoute<["a" | "b" | "c"]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
