import { toNodeHandler } from "h3/node";

import app from "./app";

import { devSetup } from "{{ createImport 'lib' 'api:factory' }}";

export default devSetup(() => {
  return {
    requestHandler: toNodeHandler(app),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
