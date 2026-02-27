import { defineRoute } from "@test/index";

export default defineRoute<[number]>(({ GET }) => [
  GET<{ response: [200, "json" ] }>(async (ctx) => {
    ctx.body = {};
  }),
]);
