import { Router } from "@solidjs/router";

import { base } from "{{ createImport 'libCore' }}";
import routerFactory from "{{ createImport 'lib' 'router' }}";
import App from "./App";

export default routerFactory((routes) => {
  return {
    clientRouter() {
      return <Router root={App} base={base}>{routes}</Router>;
    },
    serverRouter(url) {
      return <Router root={App} base={base} url={url.pathname}>
        {routes}
      </Router>;
    },
  }
});
