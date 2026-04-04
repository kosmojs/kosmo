declare module "#templates/*" {
  const src: string;
  export default src;
}

declare module "{{ createImport 'config' }}" {
  export const baseurl: string;
}
