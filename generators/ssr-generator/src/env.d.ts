declare module "{{ createImport 'libCore' }}" {
  export const base: string;
}

declare module "{{ createImport 'lib' 'ssr:routes' }}" {
  export const pathPatterns: Array<string>;
}
