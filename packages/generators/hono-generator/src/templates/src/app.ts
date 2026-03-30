import defaultErrorHandler from "./errors";
import router from "./router";

import { appFactory, routes } from "{{ createImport 'lib' 'api:factory' }}";

export default appFactory(({ createApp }) => {
  const app = createApp({ router });

  app.onError(defaultErrorHandler);

  for (const { path, methods, middleware } of routes) {
    app.on(methods, [path], ...middleware);
  }

  return app;
});
