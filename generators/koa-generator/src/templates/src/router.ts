import { routerFactory, routes } from "{{ createImport 'lib' 'api:factory' }}";

export default routerFactory(({ createRouter }) => {
  const router = createRouter();

  for (const { name, path, methods, middleware } of routes) {
    router.register(path, methods, middleware, { name });
  }

  return router;
});
