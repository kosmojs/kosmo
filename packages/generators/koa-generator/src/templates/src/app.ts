import router from "{{ createImport 'api' 'router' }}";
import { appFactory } from "{{ createImport 'lib' 'api:app' }}";

export default appFactory(({ createApp }) => {
  const app = createApp();

  // NOTE: Routes should be added last, after any middleware
  app.use(router.routes());

  return app;
});
