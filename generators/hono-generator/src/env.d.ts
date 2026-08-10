declare const KOSMO_PRODUCTION_BUILD: boolean;

declare module "{{ createImport 'libCore' }}" {
  import type { ApiRouteSerialized } from "@kosmojs/core";
  export const apiRouteMap: Record<string, ApiRouteSerialized>;
}

declare module "{{ createImport 'libApi' }}" {
  export * from "#/templates/lib/api";
}

declare module "{{ createImport 'lib' 'api:factory' }}" {
  export * from "#/templates/lib/api:factory";
}

declare module "{{ createImport 'api' 'use' }}" {
  export * from "#/templates/src/route/use";
}
