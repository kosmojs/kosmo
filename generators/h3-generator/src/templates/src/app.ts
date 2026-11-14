import { onError } from "h3";

import appFactory from "{{ createImport 'lib' 'api:factory' }}";
import defaultErrorHandler from "./errors";

export default appFactory(({ app }) => {
  app.use(onError(defaultErrorHandler));
});
