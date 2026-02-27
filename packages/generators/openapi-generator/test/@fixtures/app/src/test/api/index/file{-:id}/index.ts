import { defineRoute } from "@test/index";

export default defineRoute<[number]>(({ POST }) => [
  POST<{ response: [200, "json" ] }>(async (ctx) => {
    ctx.body = {};
  }),
]);
