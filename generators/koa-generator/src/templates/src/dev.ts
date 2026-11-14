import app from "./app";

import { devSetup } from "{{ createImport 'lib' 'api:factory' }}";

export default devSetup(() => {
  return {
    requestHandler: app.callback(),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
