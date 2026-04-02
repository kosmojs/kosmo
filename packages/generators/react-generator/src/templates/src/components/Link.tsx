import {
  type LinkProps as RouterLinkProps,
  Link as RouterLink,
  useLocation,
} from "react-router";
import type { ReactNode } from "react";
import { stringify } from "@kosmojs/core/fetch";

import { type LinkProps, routeMap } from "{{ createImport 'lib' 'router' }}";
import { baseurl } from "{{ createImport 'config' }}";

export default function Link(
  props: Omit<RouterLinkProps, "to"> & {
    to?: LinkProps;
    query?: Record<string | number, unknown>;
    children: ReactNode;
  },
) {
  const { to, query, children, ...restProps } = props;
  const location = useLocation();

  const href = () => {
    if (to) {
      const [key, ...params] = to;
      return routeMap[key]?.base(params as never, query);
    }
    const path = location.pathname.replace(
      new RegExp(`^${baseurl.replace(/\/+$/, "")}/`),
      "/",
    );
    return query ? [path, stringify(query)].join("?") : path;
  };

  return (
    <RouterLink {...restProps} to={href()}>
      {children}
    </RouterLink>
  );
}
