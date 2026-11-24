import { defineService } from "{{ createImport 'lib' 'sidecar' }}";

export default defineService({
  async start() {
    /* start the service and return a function that stops it;
     * called by sidecar/run.ts, and by the dev server when sidecar.serve is true
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
