import router from "./router";

import { appFactory } from "{{ createImport 'lib' 'api:factory' }}";

export default appFactory(({ createApp }) => {
  const app = createApp();

  // NOTE: Routes should be added last, after any middleware
  app.use(router.routes());

  return app;
});
