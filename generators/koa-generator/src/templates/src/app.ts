import appFactory, { routes } from "{{ createImport 'lib' 'api:factory' }}";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.use(defaultErrorHandler);
})
