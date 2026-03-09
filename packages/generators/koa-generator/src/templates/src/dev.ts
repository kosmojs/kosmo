import app from "./app";

import { devSetup } from "{{ createImport 'lib' 'api-factory' }}";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
  teardownHandler() {
    // close db connections, server sockets etc.
  },
});
