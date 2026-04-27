import { defineRoute } from "@test/index";

export default defineRoute<"params/[number]", [number]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
