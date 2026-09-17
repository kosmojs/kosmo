import { defineService } from "{{ createImport 'lib' 'sidecar' }}";

export default defineService({
  async start() {
    /* start the service;
     * relevant only if sidecar.serve is true in kosmo.config.ts
     * */
    return async () => {
      /* close the server;
       * highly recommended in dev mode, to avoid EADDRINUSE errors
       * */
    }
  },
  async teardown() {
    /* close outbound connections, if any (database, socket, etc.);
     * called before closing the server
     * */
  },
});
