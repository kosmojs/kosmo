import { defineRoute } from "@test/index";

export default defineRoute<[number]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
