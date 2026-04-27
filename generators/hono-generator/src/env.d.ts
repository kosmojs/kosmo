declare const KOSMO_PRODUCTION_BUILD: boolean;

declare module "#templates/*" {
  const src: string;
  export default src;
}

declare module "{{ createImport 'libApi' }}" {
  export * from "#templates/lib/api.ts";
}

declare module "{{ createImport 'lib' 'api:factory' }}" {
  export * from "#templates/lib/api:factory.ts";
}

declare module "{{ createImport 'api' 'use' }}" {
  export * from "#templates/src/route/use.ts";
}
