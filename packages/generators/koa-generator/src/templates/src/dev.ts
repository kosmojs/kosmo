import app from "{{ createImport 'api' 'app' }}";
import { devSetup } from "{{ createImport 'lib' 'api:dev' }}";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
  teardownHandler() {
    // close db connections, server sockets etc.
  },
});
