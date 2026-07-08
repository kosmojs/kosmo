declare const KOSMO_PRODUCTION_BUILD: boolean;

declare module "{{ createImport 'libApi' }}" {
  export * from "@src/templates/lib/api";
}

declare module "{{ createImport 'lib' 'api:factory' }}" {
  export * from "@src/templates/lib/api:factory";
}

declare module "{{ createImport 'api' 'use' }}" {
  export * from "@src/templates/src/route/use";
}
