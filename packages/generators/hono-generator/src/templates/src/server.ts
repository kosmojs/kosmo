import app from "./app";

import { serverFactory } from "{{ createImport 'lib' 'api-factory' }}";

serverFactory(({ createServer }) => {
  createServer(app);
});
