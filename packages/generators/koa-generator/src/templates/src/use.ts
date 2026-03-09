import defaultErrorHandler from "./errors";

import { use } from "{{ createImport 'libApi' }}";

export default [
  /**
   * Define global middleware applied to all routes.
   * Can be overridden on a per-route basis using the slot key.
   * */
  use(defaultErrorHandler, { slot: "errorHandler" }),
];
