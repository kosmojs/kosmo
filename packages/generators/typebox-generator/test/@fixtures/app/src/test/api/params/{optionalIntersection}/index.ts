import { defineRoute } from "@test/index";

type Color = "R" | "G" | "B";

export default defineRoute<"params/{optionalIntersection}", [Color]>(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = true;
  }),
]);
