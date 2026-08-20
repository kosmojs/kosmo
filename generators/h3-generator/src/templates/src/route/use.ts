import { use } from "{{ createImport 'libApi' }}";

export type UseT = {};

export default [
  use<UseT>(async (event, next) => {
    return next();
  }),
];
