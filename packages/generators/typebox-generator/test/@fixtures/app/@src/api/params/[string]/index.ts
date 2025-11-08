import { defineRoute } from "@kosmojs/api";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
