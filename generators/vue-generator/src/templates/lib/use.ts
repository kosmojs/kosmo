import { useRoute, useRouter } from "vue-router";

import type { RouterWithLoaderData } from "./router";

/**
 * Reads loader data for the current page or one of its layouts.
 * Without a key, returns the page's own data.
 * For a layout, pass its path-qualified name (e.g. "dashboard/layout") -
 * a hook can't tell which layout it runs in.
 * */
export const useLoaderData = <T>(key?: string): T | undefined => {
  const router = useRouter() as RouterWithLoaderData;
  const route = useRoute();
  return router.__loaderData?.[key || (route.name as string)] as T;
};
