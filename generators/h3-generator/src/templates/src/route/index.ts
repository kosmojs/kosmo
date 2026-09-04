import { defineRoute } from "{{ createImport 'libApi' }}";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (event) => {
    return "{{route.name}} route starts here - replace this response with real logic.";
  }),
]);
