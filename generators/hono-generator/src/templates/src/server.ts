import { serve } from "{{ createImport 'lib' 'api:factory' }}";
import app from "./app";

await serve(app);
