import appFactory from "{{ createImport 'lib' 'api:factory' }}";
import defaultErrorHandler from "./errors";

export default appFactory(({ app }) => {
  app.use(defaultErrorHandler);
})
