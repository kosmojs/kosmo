import { use } from "{{ createImport 'libApi' }}";

export default [
  use(async (ctx, next) => {
    // Always `return next()` or `await next()`;
    // ❗ Never call `next()` by itself!
    return next();
  }),
];
