import { routerFactory } from "{{ createImport 'lib' 'api:router' }}";

export default routerFactory(({ createRouter }) => {
  const router = createRouter();
  return router;
});
