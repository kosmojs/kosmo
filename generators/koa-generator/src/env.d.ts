declare module "virtual:kosmo/env" {
  export const command: "serve" | "build";
}

declare module "{{ createImport 'libApi' }}" {
  export * from "#/templates/lib/api";
}

declare module "{{ createImport 'lib' 'api:factory' }}" {
  export * from "#/templates/lib/api:factory";
  export { default } from "#/templates/lib/api:factory";
}

declare module "{{ createImport 'api' 'use' }}" {
  export * from "#/templates/src/route/use";
}

declare module "{{ createImport 'api' 'app' }}" {
  import type { App } from "#/templates/lib/@api/app";
  const app: App;
  export default app;
}
