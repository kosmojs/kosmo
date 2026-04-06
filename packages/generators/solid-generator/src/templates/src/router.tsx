import { Router } from "@solidjs/router";

import { baseurl } from "{{ createImport 'config' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import app from "./App";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      return {
        router: <Router root={app} base={baseurl}>{routes}</Router>,
        app,
      };
    },
    async serverRouter(url) {
      return {
        router: <Router root={app} base={baseurl} url={url.pathname}>{routes}</Router>,
        app,
      };
    },
  }
});
