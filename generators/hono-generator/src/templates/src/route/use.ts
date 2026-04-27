import { use } from "{{ createImport 'libApi' }}";

export type ExtendT = {};

export default [
  use<ExtendT>(async (ctx, next) => {
    // Always `return next()` or `await next()`;
    // ❗ Never call `next()` by itself!
    return next();
  }),
];
