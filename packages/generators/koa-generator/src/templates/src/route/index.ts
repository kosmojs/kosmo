import { defineRoute } from "{{ createImport 'libApi' }}";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route";
  }),
]);
