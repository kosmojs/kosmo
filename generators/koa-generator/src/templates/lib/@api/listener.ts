import { createListener } from "./server";

import app from "{{ createImport 'api' 'app' }}";

/**
 * Entry for the `dist/<folder>/api/listener.js` bundle.
 * Exposes this folder's API as a plain node:http listener, mounted by `dist/run.js`
 * next to the other folders. Nothing here listens on a port - `server.ts` does that.
 * */
export default createListener(app);
