import appFactory, { routes } from "{{ createImport 'lib' 'api:factory' }}";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app, router }) => {

  app.on("error", defaultErrorHandler);

  // NOTE: Routes should be added last, after any middleware
  app.use(router.routes());

});
