import type { JSX, ParentComponent } from "solid-js";
import { Router, type RouteDefinition } from "@solidjs/router";
import type { RouterFactoryReturn } from "@kosmojs/core";
import { createRouterFactory } from "@kosmojs/core/generators";

import { base } from "{{ createImport 'libCore' }}";

export const createRouters = (
  routes: Array<RouteDefinition>,
  { app }: { app: ParentComponent },
): {
  clientRouter: () => RouterFactoryReturn<JSX.Element>;
  serverRouter: (url: URL) => RouterFactoryReturn<JSX.Element>;
} => {
  const clientRouter = () => {
    const component = (
      <Router root={app} base={base}>
        {routes}
      </Router>
    );
    return { component };
  }

  const serverRouter = (url: URL) => {
    const component = (
      <Router root={app} base={base} url={url.pathname}>
        {routes}
      </Router>
    );
    return { component };
  }

  return { clientRouter, serverRouter };
}

export default createRouterFactory<RouteDefinition, JSX.Element>();
