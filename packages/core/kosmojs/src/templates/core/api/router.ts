import { createRouter, type RouterOptions } from "@kosmojs/api";

export default (options?: RouterOptions) => {
  const router = createRouter(options);
  return router;
};
