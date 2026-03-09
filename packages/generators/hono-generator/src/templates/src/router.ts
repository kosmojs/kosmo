import { routerFactory } from "{{ createImport 'lib' 'api-factory' }}";

export default routerFactory(({ createRouter }) => {
  const router = createRouter();
  return router;
});
