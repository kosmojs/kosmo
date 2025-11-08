import { defineRoute } from "@kosmojs/api";

export default defineRoute<[number]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
