import { h, type JSX } from "preact";
import { stringify } from "@kosmojs/core/fetch";

import { type LinkProps, linkMap } from "{{ createImport 'lib' 'router' }}";

export default function Link(
  props: Omit<h.JSX.IntrinsicElements["a"], "href"> & {
    to?: LinkProps;
    query?: Record<string | number, unknown>;
  },
): JSX.Element {
  const { to, query, children, ...restProps } = props;

  let href: string;

  if (to) {
    const [key, ...params] = to;
    href = linkMap[key]?.base(params as never, query) ?? "";
  } else {
    href = query ? `?${stringify(query)}` : "";
  }

  return h("a", { ...restProps, href }, children);
}
