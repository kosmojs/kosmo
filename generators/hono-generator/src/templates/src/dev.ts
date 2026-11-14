import { getRequestListener } from "@hono/node-server";

import app from "./app";

import { devSetup } from "{{ createImport 'lib' 'api:factory' }}";

export default devSetup(() => {
  return {
    requestHandler: getRequestListener(app.fetch),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
