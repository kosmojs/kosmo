import { defineRoute } from "{{ createImport 'libApi' }}";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (ctx) => {
    // Always `return` the response!
    // ❗ Never call `ctx.json()` / `ctx.text()` / `ctx.body()` without returning!
    return ctx.text("{{route.name}} route starts here - replace this response with real logic.");
  }),
]);
