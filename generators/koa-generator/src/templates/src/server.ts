import app from "./app";

import { serverFactory } from "{{ createImport 'lib' 'api:factory' }}";

serverFactory(async ({ createServer }) => {
  await createServer(app);
});
