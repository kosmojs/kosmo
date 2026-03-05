import { getRequestListener } from "@hono/node-server";

import app from "{{ createImport 'api' 'app' }}";
import { devSetup } from "{{ createImport 'lib' 'api:dev' }}";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
  teardownHandler() {
    // close db connections, server sockets etc.
  },
});
