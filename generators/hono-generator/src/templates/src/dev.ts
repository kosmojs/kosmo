import { getRequestListener } from "@hono/node-server";

import app from "./app";

import { devSetup } from "{{ createImport 'lib' 'api:factory' }}";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
  teardownHandler() {
    // close db connections, server sockets etc.
  },
});
