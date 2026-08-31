import { type RequestContext, store } from "{{ createImport 'libCore' 'ssr' }}";
import { renderWrapper } from "{{ createImport 'libEntry' 'server' }}";

export { default as backendApp } from "virtual:kosmo/backend-app";

export { default as ssrApp } from "{{ createImport 'entry' 'server' }}";

/**
 * Wrap a render call, making the given context visible to every component
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
