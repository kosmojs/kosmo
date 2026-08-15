import { type RequestContext, store } from "./base";

import { renderWrapper } from "{{ createImport 'libEntry' 'server' }}";

export { default as ssrApp } from "{{ createImport 'entry' 'server' }}";
export { apiApp } from "{{ createImport 'lib' '@ssr/api' }}";

/**
 * Wraps a render call, making the given context visible to every
 * fetch dispatch that happens during it - across await points,
 * stream chunks and parallel component data loads.
 * */
export const withSsrContext = <T>(
  context: RequestContext,
  render: () => T,
): T => {
  return store.run(context, () => renderWrapper(context, render));
};

export const errorProvider = () => {
  return store.getStore()?.error;
};
