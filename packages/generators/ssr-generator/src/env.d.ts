declare module "*.hbs" {
  const src: string;
  export default src;
}

declare module "*?as=text" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'config' }}" {
  export const baseurl: string;
}

declare module "{{ createImport 'lib' 'ssr:routes' }}" {
  export const routeMap: Array<{
    match: (path: string) => boolean;
    file: string;
    layouts: Array<string>;
  }>;
}
