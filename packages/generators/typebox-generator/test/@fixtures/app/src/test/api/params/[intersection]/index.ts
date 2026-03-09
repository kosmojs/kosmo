import { defineRoute } from "@test/index";

type Color = "R" | "G" | "B";

export default defineRoute<"params/[intersection]", [Color]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
