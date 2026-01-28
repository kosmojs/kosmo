import app from "{{ createImport 'api' 'app' }}";
import { serverFactory } from "{{ createImport 'lib' 'api:server' }}";

serverFactory(({ createServer }) => {
  createServer(app);
});
