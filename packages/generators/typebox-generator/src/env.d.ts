declare module "*.hbs" {
  const src: string;
  export default src;
}

declare module "*?as=text" {
  const content: string;
  export default content;
}

declare module "{{ createImport 'lib' '@typebox/setup' }}" {
  export const customTypes = {};
  export const validationMessages = {};
}
