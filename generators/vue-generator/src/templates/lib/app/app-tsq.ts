import { VueQueryPlugin } from "@tanstack/vue-query";
import type { Plugin } from "vue";

import { getQueryClient } from "../query";

export { default as AppProvider } from "./provider.vue";

export const appProvider: Plugin = {
  install(app) {
    app.use(VueQueryPlugin, { queryClient: getQueryClient() });
  },
};
