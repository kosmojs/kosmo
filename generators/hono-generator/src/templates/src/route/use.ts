import { use } from "{{ createImport 'libApi' }}";

export type UseT = {};

export default [
  use<UseT>(async (ctx, next) => {
    // Always `return next()` or `await next()`;
    // ❗ Never call `next()` by itself!
    return next();
  }),
];
