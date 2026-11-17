import { devSetup } from "{{ createImport 'lib' 'api:dev' }}";

export default devSetup(async () => {
  // imported here, so the app loads with the first API request rather than at start
  const { default: app } = await import("./app");
  return {
    requestHandler: app.callback(),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
