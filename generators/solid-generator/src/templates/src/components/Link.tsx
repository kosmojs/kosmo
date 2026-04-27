import { A, type AnchorProps } from "@solidjs/router";
import { type JSXElement, splitProps } from "solid-js";

import { pageRouteMap, type LinkProps } from "{{ createImport 'libCore' }}";

export default function Link(
  props: Omit<AnchorProps, "href"> & {
    to: LinkProps;
    query?: Record<string | number, unknown>;
    children: JSXElement;
  },
) {
  const [knownProps, restProps] = splitProps(props, [
    "to",
    "query",
    "children",
  ]);

  const href = () => {
    const [key, ...params] = knownProps.to;
    return pageRouteMap[key]?.base(params as never, knownProps.query);
  };

  return <A {...{ ...restProps, href: href() }}>{knownProps.children}</A>;
}
