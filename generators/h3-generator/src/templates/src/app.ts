import { onError } from "h3";

import appFactory, { routes, type App } from "{{ createImport 'lib' 'api:factory' }}";
import defaultErrorHandler from "./errors";

export default appFactory(routes, ({ app }) => {
  app.use(onError(defaultErrorHandler));
}) as App;
