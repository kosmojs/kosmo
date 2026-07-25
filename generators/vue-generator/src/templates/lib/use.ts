import { useRoute, useRouter } from "vue-router";

import type { RouterWithLoaderData } from "./router";

/**
 * Reads the current route's loader data. The key is the route name,
 * resolved from the active route - callers pass nothing.
 * */
export const useLoaderData = <T>(): T => {
  const route = useRoute();
  const router = useRouter() as RouterWithLoaderData;
  const key = String(route.name ?? route.path);
  return router.__loaderData?.[key] as T;
};
