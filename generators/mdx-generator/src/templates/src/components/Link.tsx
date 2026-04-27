import { h, type JSX } from "preact";

import { pageRouteMap, type LinkProps } from "{{ createImport 'libCore' }}";

export default function Link(
  props: Omit<h.JSX.IntrinsicElements["a"], "href"> & {
    to: LinkProps;
    query?: Record<string | number, unknown>;
  },
): JSX.Element {
  const { to, query, children, ...restProps } = props;

  const [key, ...params] = to;
  const href = pageRouteMap[key]?.base(params as never, query);

  return h("a", { ...restProps, href }, children);
}
