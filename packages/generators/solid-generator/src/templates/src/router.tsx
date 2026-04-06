import { Router } from "@solidjs/router";

import { baseurl } from "{{ createImport 'config' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      return <Router root={App} base={baseurl}>{routes}</Router>;
    },
    async serverRouter(url) {
      return <Router root={App} base={baseurl} url={url.pathname}>
        {routes}
      </Router>;
    },
  }
});
