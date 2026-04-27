import { Router } from "@solidjs/router";

import { base } from "{{ createImport 'libCore' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App";

export default routerFactory((routes) => {
  return {
    async clientRouter() {
      return <Router root={App} base={base}>{routes}</Router>;
    },
    async serverRouter(url) {
      return <Router root={App} base={base} url={url.pathname}>
        {routes}
      </Router>;
    },
  }
});
