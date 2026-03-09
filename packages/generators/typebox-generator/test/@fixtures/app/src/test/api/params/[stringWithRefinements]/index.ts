import { defineRoute } from "@test/index";

export default defineRoute<
  "params/[stringWithRefinements]",
  [TRefine<string, { minLength: 1; maxLength: 5 }>]
>(
  ({ GET }) => [
    GET(async (ctx) => {
      ctx.body = true;
    }),
  ],
);
