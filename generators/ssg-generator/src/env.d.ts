declare module "{{ createImport 'libCore' }}" {
  export const base: string;
}

declare module "{{ createImport 'lib' 'ssg:routes' }}" {
  import type { PageRoute } from "@kosmojs/core";
  const modules: Record<
    string,
    {
      module: unknown;
      pathPattern: string;
      params: PageRoute["params"];
    }
  >;
  export default modules;
}
