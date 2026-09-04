import { defineRoute } from "{{ createImport 'libApi' }}";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "{{route.name}} route starts here - replace this response with real logic.";
  }),
]);
