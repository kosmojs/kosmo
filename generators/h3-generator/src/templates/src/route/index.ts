import { defineRoute } from "{{ createImport 'libApi' }}";

export default defineRoute<"{{route.name}}">(({ GET }) => [
  GET(async (event) => {
    return "Automatically generated route";
  }),
]);
